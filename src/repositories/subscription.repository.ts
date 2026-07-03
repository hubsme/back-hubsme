import { Injectable } from '@nestjs/common';
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  subscription,
  SubscriptionDTO,
  subscriptionStatusEnum,
} from '@db/tables/subscription.table';

@Injectable()
export class SubscriptionRepository {
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

  async findOne(id: number) {
    const result = await database
      .select()
      .from(subscription)
      .where(and(eq(subscription.id, id), isNull(subscription.deletedAt)));
    return result[0];
  }

  async findByUserId(userId: number) {
    const result = await database
      .select()
      .from(subscription)
      .where(and(eq(subscription.userId, userId), isNull(subscription.deletedAt)));
    return result[0];
  }

  async create(data: SubscriptionDTO) {
    const result = await database.insert(subscription).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<SubscriptionDTO>) {
    const result = await database
      .update(subscription)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(subscription.id, id), isNull(subscription.deletedAt)))
      .returning();
    return result[0];
  }
}
