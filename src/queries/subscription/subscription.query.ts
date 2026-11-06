import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { subscription, subscriptionStatusEnum } from '@db/tables/subscription.table';
import { and, count, desc, eq, isNull, sql } from 'drizzle-orm';

@Injectable()
export class SubscriptionQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'subscription.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      userId?: number;
      plan?: 'free' | 'basic' | 'pro' | 'expert';
      status?: (typeof subscriptionStatusEnum.enumValues)[number];
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.userId) conditions.push(eq(subscription.userId, filters.userId));
    if (filters?.plan) conditions.push(eq(sql`${subscription.plan}::text`, filters.plan));
    if (filters?.status) conditions.push(eq(sql`${subscription.status}::text`, filters.status));
    conditions.push(isNull(subscription.deletedAt));
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(subscription).where(whereClause);
    const data = await database
      .select()
      .from(subscription)
      .where(whereClause)
      .orderBy(desc(subscription.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'subscription.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(subscription)
      .where(and(eq(subscription.id, id), isNull(subscription.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'subscription.findByUserId', type: 'method' })
  async findByUserId(userId: number) {
    const result = await database
      .select()
      .from(subscription)
      .where(and(eq(subscription.userId, userId), isNull(subscription.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'subscription.create', type: 'method' })
  async create(data: typeof subscription.$inferInsert) {
    const result = await database.insert(subscription).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'subscription.update', type: 'method' })
  async update(id: number, data: Partial<typeof subscription.$inferInsert>) {
    const result = await database
      .update(subscription)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(subscription.id, id), isNull(subscription.deletedAt)))
      .returning();
    return result[0];
  }
}
