import { pgTable, serial, text, timestamp, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const consultantAvailabilityStatusEnum = pgEnum('consultant_availability_status', [
  'disponible',
  'bloqueado',
]);

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
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time').notNull(),
    status: consultantAvailabilityStatusEnum('status').default('disponible').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('consultant_availability_consultant_id_idx').on(t.consultantId),
    index('consultant_availability_start_time_idx').on(t.startTime),
    index('consultant_availability_end_time_idx').on(t.endTime),
    index('consultant_availability_status_idx').on(t.status),
    uniqueIndex('consultant_availability_slot_unique_active_idx')
      .on(t.consultantId, t.startTime, t.endTime)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type ConsultantAvailability = typeof consultantAvailability.$inferSelect;
export type ConsultantAvailabilityDTO = typeof consultantAvailability.$inferInsert;
