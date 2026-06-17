import { date, index, integer, jsonb, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export type ConsultantAvailabilitySchedule = Record<string, string[]>;

export const consultantAvailability = pgTable(
  'consultant_availability',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    month: date('month', { mode: 'date' }).notNull(),
    availableSchedule: jsonb('available_schedule').$type<ConsultantAvailabilitySchedule>().default({}).notNull(),
  },
  (t) => [
    index('consultant_availability_consultant_id_idx').on(t.consultantId),
    index('consultant_availability_month_idx').on(t.month),
    uniqueIndex('consultant_availability_month_unique_active_idx')
      .on(t.consultantId, t.month)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type ConsultantAvailability = typeof consultantAvailability.$inferSelect;
export type ConsultantAvailabilityDTO = typeof consultantAvailability.$inferInsert;
