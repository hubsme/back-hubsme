import { pgTable, serial, text, varchar, timestamp, integer, decimal, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const consultant = pgTable(
  'consultant',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
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
    index('consultant_name_idx').using('gin', t.name.op('gin_trgm_ops')),
    index('consultant_specialties_idx').using('gin', t.specialties),
    index('consultant_sectors_idx').using('gin', t.sectors),
    index('consultant_active_idx').on(t.active),
    index('consultant_user_id_idx').on(t.userId),
    uniqueIndex('consultant_user_unique_active_idx')
      .on(t.userId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Consultant = typeof consultant.$inferSelect;
export type ConsultantDTO = typeof consultant.$inferInsert;
