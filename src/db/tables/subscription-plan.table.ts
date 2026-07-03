import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const subscriptionPlan = pgTable('subscription_plans', {
  id: text('id').primaryKey(), // 'free', 'basic', 'pro', 'expert'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  description: text('description').notNull(),
  features: text('features').array().default([]).notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect;
export type SubscriptionPlanDTO = typeof subscriptionPlan.$inferInsert;
