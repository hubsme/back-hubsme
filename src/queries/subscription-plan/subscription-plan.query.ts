import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { subscriptionPlan } from '@db/tables/subscription-plan.table';
import { and, asc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class SubscriptionPlanQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'subscription-plan.findAll', type: 'method' })
  async findAll() {
    return database
      .select()
      .from(subscriptionPlan)
      .where(isNull(subscriptionPlan.deletedAt))
      .orderBy(asc(subscriptionPlan.price));
  }

  @TraceNode({ name: 'subscription-plan.findById', type: 'method' })
  async findById(id: string) {
    const results = await database
      .select()
      .from(subscriptionPlan)
      .where(and(eq(subscriptionPlan.id, id), isNull(subscriptionPlan.deletedAt)));
    return results[0];
  }
}
