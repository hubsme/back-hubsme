import { Injectable } from '@nestjs/common';
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lt,
  lte,
  or,
  sql,
} from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  promotionCode,
  PromotionCodeDTO,
  promotionCodeRedemption,
} from '@db/tables/promotion-code.table';
import {
  mercadoPagoPayment,
  MercadoPagoPaymentRaw,
} from '@db/tables/mercado-pago-payment.table';

@Injectable()
export class PromotionCodeRepository {
  async findAllPaginated(page: number, limit: number, search?: string) {
    const conditions = [isNull(promotionCode.deletedAt)];
    const term = search?.trim();
    if (term) {
      conditions.push(
        or(
          ilike(promotionCode.code, `%${term}%`),
          ilike(promotionCode.description, `%${term}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(promotionCode).where(whereClause);
    const data = await database
      .select()
      .from(promotionCode)
      .where(whereClause)
      .orderBy(desc(promotionCode.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(promotionCode)
      .where(and(eq(promotionCode.id, id), isNull(promotionCode.deletedAt)));
    return result[0];
  }

  async create(data: PromotionCodeDTO) {
    const result = await database.insert(promotionCode).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<PromotionCodeDTO>) {
    const result = await database
      .update(promotionCode)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(promotionCode.id, id), isNull(promotionCode.deletedAt)))
      .returning();
    return result[0];
  }

  async findRedemptionByCheckout(checkoutId: number) {
    const result = await database
      .select()
      .from(promotionCodeRedemption)
      .where(
        and(
          eq(promotionCodeRedemption.checkoutId, checkoutId),
          isNull(promotionCodeRedemption.deletedAt),
        ),
      );
    return result[0];
  }

  async claim(code: string, checkoutId: number, pymeId: number, consultantId: number) {
    try {
      return await database.transaction(async (tx) => {
        const existing = await tx
          .select()
          .from(promotionCodeRedemption)
          .where(
            and(
              eq(promotionCodeRedemption.checkoutId, checkoutId),
              isNull(promotionCodeRedemption.deletedAt),
            ),
          );
        if (existing[0]) {
          const codeResult = await tx
            .select()
            .from(promotionCode)
            .where(eq(promotionCode.id, existing[0].promotionCodeId));
          return codeResult[0]
            ? { promotion: codeResult[0], redemption: existing[0] }
            : undefined;
        }

        const now = new Date();
        const claimedCodes = await tx
          .update(promotionCode)
          .set({
            redemptionCount: sql`${promotionCode.redemptionCount} + 1`,
            updatedAt: now,
          })
          .where(
            and(
              eq(promotionCode.code, code),
              eq(promotionCode.isActive, true),
              isNull(promotionCode.deletedAt),
              lt(promotionCode.redemptionCount, promotionCode.maxRedemptions),
              or(isNull(promotionCode.startsAt), lte(promotionCode.startsAt, now)),
              or(isNull(promotionCode.expiresAt), gte(promotionCode.expiresAt, now)),
            ),
          )
          .returning();

        if (!claimedCodes[0]) return undefined;

        const redemptions = await tx
          .insert(promotionCodeRedemption)
          .values({
            promotionCodeId: claimedCodes[0].id,
            checkoutId,
            pymeId,
            consultantId,
          })
          .returning();

        return { promotion: claimedCodes[0], redemption: redemptions[0] };
      });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;

      const existing = await this.findRedemptionByCheckout(checkoutId);
      if (!existing) return undefined;
      const existingCode = await this.findOne(existing.promotionCodeId);
      return existingCode
        ? { promotion: existingCode, redemption: existing }
        : undefined;
    }
  }

  async finalizeClaim(
    redemptionId: number,
    checkoutId: number,
    meetingId: number,
    rawPayment: MercadoPagoPaymentRaw,
  ) {
    return database.transaction(async (tx) => {
      await tx
        .update(mercadoPagoPayment)
        .set({
          meetingId,
          status: 'approved',
          marketplaceFee: '0.00',
          rawPayment,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(mercadoPagoPayment.id, checkoutId),
            isNull(mercadoPagoPayment.deletedAt),
          ),
        );

      const result = await tx
        .update(promotionCodeRedemption)
        .set({ meetingId, updatedAt: new Date() })
        .where(
          and(
            eq(promotionCodeRedemption.id, redemptionId),
            isNull(promotionCodeRedemption.deletedAt),
          ),
        )
        .returning();
      return result[0];
    });
  }

  async releaseClaim(redemptionId: number) {
    return database.transaction(async (tx) => {
      const released = await tx
        .update(promotionCodeRedemption)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(promotionCodeRedemption.id, redemptionId),
            isNull(promotionCodeRedemption.deletedAt),
            isNull(promotionCodeRedemption.meetingId),
          ),
        )
        .returning();

      if (!released[0]) return;

      await tx
        .update(promotionCode)
        .set({
          redemptionCount: sql`GREATEST(${promotionCode.redemptionCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(promotionCode.id, released[0].promotionCodeId));
    });
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
