import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const consultantGoogleCalendar = pgTable(
  'consultant_google_calendar',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    googleEmail: varchar('google_email', { length: 255 }).notNull(),
    googleCalendarId: varchar('google_calendar_id', { length: 255 }).default('primary').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token').notNull(),
    tokenExpiresAt: timestamp('token_expires_at'),
    scope: text('scope'),
    connectedAt: timestamp('connected_at').defaultNow().notNull(),
  },
  (t) => [
    index('consultant_google_calendar_consultant_id_idx').on(t.consultantId),
    index('consultant_google_calendar_google_email_idx').on(t.googleEmail),
    uniqueIndex('consultant_google_calendar_consultant_unique_active_idx')
      .on(t.consultantId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type ConsultantGoogleCalendar = typeof consultantGoogleCalendar.$inferSelect;
export type ConsultantGoogleCalendarDTO = typeof consultantGoogleCalendar.$inferInsert;
