import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { subscriptionPlan } from '@db/tables/subscription-plan.table';

@Injectable()
export class SubscriptionPlanRepository {
  async findAll() {
    return database
      .select()
      .from(subscriptionPlan)
      .where(isNull(subscriptionPlan.deletedAt))
      .orderBy(asc(subscriptionPlan.price));
  }

  async findById(id: string) {
    const results = await database
      .select()
      .from(subscriptionPlan)
      .where(and(eq(subscriptionPlan.id, id), isNull(subscriptionPlan.deletedAt)));
    return results[0];
  }
}
