import { index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { meeting } from './meeting.table';

export const scheduledNotificationRecipientEnum = pgEnum('scheduled_notification_recipient', ['pyme', 'consultor']);

export const scheduledNotificationStatusEnum = pgEnum('scheduled_notification_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
]);

export type MeetingReminderPayload = {
  to: string;
  tiempo_header: string;
  nombre_pyme: string;
  nombre_consultor: string;
  titulo_sesion: string;
  fecha_hora: string;
  tiempo_body: string;
  enlace: string;
};

export const scheduledNotification = pgTable(
  'scheduled_notification',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'cascade' }),
    recipient: scheduledNotificationRecipientEnum('recipient').notNull(),
    status: scheduledNotificationStatusEnum('status').default('pending').notNull(),
    scheduledAt: timestamp('scheduled_at').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    payload: jsonb('payload').$type<MeetingReminderPayload>().notNull(),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    lockedAt: timestamp('locked_at'),
    processedAt: timestamp('processed_at'),
    lastError: text('last_error'),
  },
  (t) => [
    index('scheduled_notification_meeting_id_idx').on(t.meetingId),
    index('scheduled_notification_status_scheduled_at_idx').on(t.status, t.scheduledAt),
  ],
);

export type ScheduledNotification = typeof scheduledNotification.$inferSelect;
export type ScheduledNotificationDTO = typeof scheduledNotification.$inferInsert;
