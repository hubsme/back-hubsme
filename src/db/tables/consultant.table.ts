import { pgTable, serial, text, varchar, timestamp, integer, decimal, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const consultant = pgTable(
  'consultant',
  {
    id: integer('id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    fullName: varchar('full_name', { length: 240 }).notNull(),
    firstName: varchar('first_name', { length: 120 }),
    lastName: varchar('last_name', { length: 120 }),
    bio: text('bio'),
    specialties: text('specialties').array().default([]).notNull(),
    sectors: text('sectors').array().default([]).notNull(),
    photoUrl: text('photo_url'),
    videoUrl: text('video_url'),
    pricePerHour: decimal('price_per_hour', { precision: 10, scale: 2 }).default('0.00').notNull(),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
    totalReviews: integer('total_reviews').default(0).notNull(),
    active: varchar('active', { length: 10 }).default('true').notNull(),
    validated: varchar('validated', { length: 10 }).default('false').notNull(),
  },
  (t) => [
    index('consultant_full_name_idx').using('gin', t.fullName.op('gin_trgm_ops')),
    index('consultant_first_name_idx').using('gin', t.firstName.op('gin_trgm_ops')),
    index('consultant_last_name_idx').using('gin', t.lastName.op('gin_trgm_ops')),
    index('consultant_specialties_idx').using('gin', t.specialties),
    index('consultant_sectors_idx').using('gin', t.sectors),
    index('consultant_active_idx').on(t.active),
    uniqueIndex('consultant_user_unique_active_idx')
      .on(t.id)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Consultant = typeof consultant.$inferSelect;
export type ConsultantDTO = typeof consultant.$inferInsert;
