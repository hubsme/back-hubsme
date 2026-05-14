import { pgTable, serial, text, timestamp, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const pymeConsultantMatchStatusEnum = pgEnum('pyme_consultant_match_status', [
  'pendiente',
  'aceptado',
  'rechazado',
  'finalizado',
]);

export const pymeConsultantMatch = pgTable(
  'pyme_consultant_match',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: pymeConsultantMatchStatusEnum('status').default('pendiente').notNull(),
    source: text('source').default('manual').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('pyme_consultant_match_pyme_id_idx').on(t.pymeId),
    index('pyme_consultant_match_consultant_id_idx').on(t.consultantId),
    index('pyme_consultant_match_status_idx').on(t.status),
    uniqueIndex('pyme_consultant_match_pair_unique_active_idx')
      .on(t.pymeId, t.consultantId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type PymeConsultantMatch = typeof pymeConsultantMatch.$inferSelect;
export type PymeConsultantMatchDTO = typeof pymeConsultantMatch.$inferInsert;
