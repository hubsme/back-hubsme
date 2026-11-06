import { database, transaction } from '@db/connection.db';
import { promotionCodeRedemption } from '@db/tables/promotion-code-redemption.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class PromotionCodeRedemptionQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'promotion-code-redemption.findRedemptionByCheckout', type: 'method' })
  async findRedemptionByCheckout(checkoutId: number) {
    const result = await database
      .select()
      .from(promotionCodeRedemption)
      .where(and(eq(promotionCodeRedemption.checkoutId, checkoutId), isNull(promotionCodeRedemption.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'promotion-code-redemption.create', type: 'method' })
  async create(data: typeof promotionCodeRedemption.$inferInsert) {
    return database.insert(promotionCodeRedemption).values(data).returning();
  }
  @TraceNode({ name: 'promotion-code-redemption.linkMeeting', type: 'method' })
  async linkMeeting(id: number, meetingId: number) {
    return database
      .update(promotionCodeRedemption)
      .set({ meetingId, updatedAt: new Date() })
      .where(and(eq(promotionCodeRedemption.id, id), isNull(promotionCodeRedemption.deletedAt)))
      .returning();
  }
  @TraceNode({ name: 'promotion-code-redemption.touchClaim', type: 'method' })
  async touchClaim(id: number) {
    return database
      .update(promotionCodeRedemption)
      .set({ updatedAt: new Date() })
      .where(and(eq(promotionCodeRedemption.id, id), isNull(promotionCodeRedemption.deletedAt)))
      .returning();
  }
  @TraceNode({ name: 'promotion-code-redemption.releaseUnusedClaim', type: 'method' })
  async releaseUnusedClaim(id: number) {
    return database
      .update(promotionCodeRedemption)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(promotionCodeRedemption.id, id),
          isNull(promotionCodeRedemption.deletedAt),
          isNull(promotionCodeRedemption.meetingId),
        ),
      )
      .returning();
  }

  @TraceNode({ name: 'promotion-code-redemption.findAllByCheckout', type: 'method' })
  async findAllByCheckout(checkoutId: number) {
    return database
      .select()
      .from(promotionCodeRedemption)
      .where(and(eq(promotionCodeRedemption.checkoutId, checkoutId), isNull(promotionCodeRedemption.deletedAt)));
  }
}
