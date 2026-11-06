import { boolean, index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { meeting } from '@db/tables/meeting.table';
import { checkout } from '@db/tables/checkout.table';
import { user } from '@db/tables/user.table';
import { promotionCode } from '@db/tables/promotion-code.table';

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
      .references(() => checkout.id),
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
