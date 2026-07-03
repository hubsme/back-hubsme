import { pgTable, serial, timestamp, integer, pgEnum, index, uniqueIndex, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';
import { subscriptionPlan } from './subscription-plan.table';

export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled', 'expired']);

export const subscription = pgTable(
  'subscription',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    plan: text('plan')
      .default('free')
      .notNull()
      .references(() => subscriptionPlan.id),
    status: subscriptionStatusEnum('status').default('active').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
  },
  (t) => [
    index('subscription_user_id_idx').on(t.userId),
    index('subscription_plan_idx').on(t.plan),
    index('subscription_status_idx').on(t.status),
    uniqueIndex('subscription_user_unique_active_idx')
      .on(t.userId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Subscription = typeof subscription.$inferSelect;
export type SubscriptionDTO = typeof subscription.$inferInsert;
