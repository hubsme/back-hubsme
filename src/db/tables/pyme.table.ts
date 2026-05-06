import { pgTable, serial, text, varchar, timestamp, integer, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const pyme = pgTable(
  'pyme',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    ruc: varchar('ruc', { length: 20 }),
    sector: varchar('sector', { length: 120 }),
    numEmployees: integer('num_employees'),
    yearsInOperation: integer('years_in_operation'),
    description: text('description'),
  },
  (t) => [
    index('pyme_name_idx').using('gin', t.name.op('gin_trgm_ops')),
    index('pyme_sector_idx').on(t.sector),
    index('pyme_user_id_idx').on(t.userId),
    uniqueIndex('pyme_user_unique_active_idx')
      .on(t.userId)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex('pyme_ruc_unique_active_idx')
      .on(t.ruc)
      .where(sql`${t.deletedAt} IS NULL AND ${t.ruc} IS NOT NULL`),
  ],
);

export type Pyme = typeof pyme.$inferSelect;
export type PymeDTO = typeof pyme.$inferInsert;
