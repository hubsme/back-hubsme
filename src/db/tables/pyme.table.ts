import { pgTable, serial, text, varchar, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const pyme = pgTable(
  'pyme',
  {
    id: integer('id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    name: varchar('name', { length: 200 }).notNull(),
    ruc: varchar('ruc', { length: 20 }),
    ownerFirstName: varchar('owner_first_name', { length: 120 }),
    ownerLastName: varchar('owner_last_name', { length: 120 }),
    ownerEmail: varchar('owner_email', { length: 255 }),
    ownerPhone: varchar('owner_phone', { length: 30 }),
    ownerPosition: varchar('owner_position', { length: 120 }),
    sector: varchar('sector', { length: 120 }),
    numEmployees: integer('num_employees'),
    yearsInOperation: integer('years_in_operation'),
    description: text('description'),
    logoUrl: text('logo_url'),
  },
  (t) => [
    index('pyme_name_idx').using('gin', t.name.op('gin_trgm_ops')),
    index('pyme_owner_name_idx').using('gin', t.ownerFirstName.op('gin_trgm_ops')),
    index('pyme_owner_email_idx').on(t.ownerEmail),
    index('pyme_sector_idx').on(t.sector),
    uniqueIndex('pyme_user_unique_active_idx')
      .on(t.id)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex('pyme_ruc_unique_active_idx')
      .on(t.ruc)
      .where(sql`${t.deletedAt} IS NULL AND ${t.ruc} IS NOT NULL`),
  ],
);

export type Pyme = typeof pyme.$inferSelect;
export type PymeDTO = typeof pyme.$inferInsert;
