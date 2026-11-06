import { boolean, index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { meeting } from '@db/tables/meeting.table';
import { checkout } from '@db/tables/checkout.table';
import { user } from '@db/tables/user.table';

export const promotionCodeTypeEnum = pgEnum('promotion_code_type', ['consultation', 'service']);

export const promotionCode = pgTable(
  'promotion_code',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    code: varchar('code', { length: 40 }).notNull(),
    type: promotionCodeTypeEnum('type').default('consultation').notNull(),
    description: varchar('description', { length: 255 }),
    maxRedemptions: integer('max_redemptions').default(1).notNull(),
    redemptionCount: integer('redemption_count').default(0).notNull(),
    startsAt: timestamp('starts_at'),
    expiresAt: timestamp('expires_at'),
    allowedPymeIds: integer('allowed_pyme_ids').array(),
    allowedConsultantIds: integer('allowed_consultant_ids').array(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (t) => [
    uniqueIndex('promotion_code_code_unique_active_idx')
      .on(t.code)
      .where(sql`${t.deletedAt} IS NULL`),
    index('promotion_code_active_idx').on(t.isActive),
    index('promotion_code_type_idx').on(t.type),
    index('promotion_code_expires_at_idx').on(t.expiresAt),
  ],
);
