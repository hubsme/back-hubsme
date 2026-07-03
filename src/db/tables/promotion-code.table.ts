import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { meeting } from './meeting.table';
import { mercadoPagoPayment } from './mercado-pago-payment.table';
import { user } from './user.table';

export const promotionCode = pgTable(
  'promotion_code',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    code: varchar('code', { length: 40 }).notNull(),
    description: varchar('description', { length: 255 }),
    maxRedemptions: integer('max_redemptions').default(1).notNull(),
    redemptionCount: integer('redemption_count').default(0).notNull(),
    startsAt: timestamp('starts_at'),
    expiresAt: timestamp('expires_at'),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (t) => [
    uniqueIndex('promotion_code_code_unique_active_idx')
      .on(t.code)
      .where(sql`${t.deletedAt} IS NULL`),
    index('promotion_code_active_idx').on(t.isActive),
    index('promotion_code_expires_at_idx').on(t.expiresAt),
  ],
);

export const promotionCodeRedemption = pgTable(
  'promotion_code_redemption',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    promotionCodeId: integer('promotion_code_id')
      .notNull()
      .references(() => promotionCode.id),
    checkoutId: integer('checkout_id')
      .notNull()
      .references(() => mercadoPagoPayment.id),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id),
    meetingId: integer('meeting_id').references(() => meeting.id),
    redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('promotion_code_redemption_checkout_unique_active_idx')
      .on(t.checkoutId)
      .where(sql`${t.deletedAt} IS NULL`),
    index('promotion_code_redemption_code_idx').on(t.promotionCodeId),
    index('promotion_code_redemption_pyme_idx').on(t.pymeId),
  ],
);

export type PromotionCode = typeof promotionCode.$inferSelect;
export type PromotionCodeDTO = typeof promotionCode.$inferInsert;
export type PromotionCodeRedemption = typeof promotionCodeRedemption.$inferSelect;
