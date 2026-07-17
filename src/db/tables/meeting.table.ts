import { pgTable, serial, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { user } from './user.table';

export const meetingStatusEnum = pgEnum('meeting_status', [
  'solicitada',
  'pago_pendiente',
  'por_confirmar',
  'confirmada',
  'finalizada',
  'cancelada',
]);
export const meetingRequestedByEnum = pgEnum('meeting_requested_by', ['pyme', 'consultor']);

export const meeting = pgTable(
  'meeting',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id),
    title: text('title').notNull(),
    startTime: timestamp('start_time'),
    proposedStartTimes: text('proposed_start_times').array().default([]).notNull(),
    durationMinutes: integer('duration_minutes').default(60).notNull(),
    meetingUrl: text('meeting_url'),
    teamsOnlineMeetingId: text('teams_online_meeting_id'),
    status: meetingStatusEnum('status').default('solicitada').notNull(),
    requestedBy: meetingRequestedByEnum('requested_by').default('pyme').notNull(),
    description: text('description'),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('meeting_pyme_id_idx').on(t.pymeId),
    index('meeting_consultant_id_idx').on(t.consultantId),
    index('meeting_status_idx').on(t.status),
    index('meeting_start_time_idx').on(t.startTime),
  ],
);

export type Meeting = typeof meeting.$inferSelect;
export type MeetingDTO = typeof meeting.$inferInsert;
