import { and, count, desc, eq, gte, ilike, isNull, lt, lte, or, sql } from 'drizzle-orm';

import { database, transaction } from '@db/connection.db';
import { promotionCode } from '@db/tables/promotion-code.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PromotionCodeQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'promotion-code.findAllPaginated', type: 'method' })
  async findAllPaginated(page: number, limit: number, search?: string) {
    const conditions = [isNull(promotionCode.deletedAt)];
    const term = search?.trim();
    if (term) {
      conditions.push(or(ilike(promotionCode.code, `%${term}%`), ilike(promotionCode.description, `%${term}%`))!);
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

  @TraceNode({ name: 'promotion-code.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(promotionCode)
      .where(and(eq(promotionCode.id, id), isNull(promotionCode.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'promotion-code.create', type: 'method' })
  async create(data: typeof promotionCode.$inferInsert) {
    const result = await database.insert(promotionCode).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'promotion-code.update', type: 'method' })
  async update(id: number, data: Partial<typeof promotionCode.$inferInsert>) {
    const result = await database
      .update(promotionCode)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(promotionCode.id, id), isNull(promotionCode.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'promotion-code.findClaimedPromotion', type: 'method' })
  async findClaimedPromotion(id: number, code: string, type: (typeof promotionCode.$inferSelect)['type']) {
    return database
      .select()
      .from(promotionCode)
      .where(and(eq(promotionCode.id, id), eq(promotionCode.code, code), eq(promotionCode.type, type)));
  }
  @TraceNode({ name: 'promotion-code.claimAvailable', type: 'method' })
  async claimAvailable(
    code: string,
    type: (typeof promotionCode.$inferSelect)['type'],
    pymeId: number,
    consultantId: number,
    now: Date,
  ) {
    return database
      .update(promotionCode)
      .set({ redemptionCount: sql`${promotionCode.redemptionCount} + 1`, updatedAt: now })
      .where(
        and(
          eq(promotionCode.code, code),
          eq(promotionCode.type, type),
          eq(promotionCode.isActive, true),
          isNull(promotionCode.deletedAt),
          lt(promotionCode.redemptionCount, promotionCode.maxRedemptions),
          or(isNull(promotionCode.startsAt), lte(promotionCode.startsAt, now)),
          or(isNull(promotionCode.expiresAt), gte(promotionCode.expiresAt, now)),
          or(isNull(promotionCode.allowedPymeIds), sql`${pymeId} = ANY(${promotionCode.allowedPymeIds})`),
          or(
            isNull(promotionCode.allowedConsultantIds),
            sql`${consultantId} = ANY(${promotionCode.allowedConsultantIds})`,
          ),
        ),
      )
      .returning();
  }
  @TraceNode({ name: 'promotion-code.releaseRedemptionCount', type: 'method' })
  async releaseRedemptionCount(id: number) {
    await database
      .update(promotionCode)
      .set({ redemptionCount: sql`GREATEST(${promotionCode.redemptionCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(promotionCode.id, id));
  }
}
