import { pgTable, serial, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { user } from './user.table';

export const dashboardAlertToneEnum = pgEnum('dashboard_alert_tone', ['danger', 'warning', 'info']);
export const dashboardAlertStatusEnum = pgEnum('dashboard_alert_status', ['active', 'resolved']);

export const dashboardAlert = pgTable(
  'dashboard_alert',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consultantId: integer('consultant_id').references(() => user.id, { onDelete: 'cascade' }),
    pymeId: integer('pyme_id').references(() => user.id, { onDelete: 'cascade' }),
    clientName: text('client_name').notNull(),
    message: text('message').notNull(),
    tone: dashboardAlertToneEnum('tone').default('info').notNull(),
    status: dashboardAlertStatusEnum('status').default('active').notNull(),
    resolvedAt: timestamp('resolved_at'),
  },
  (t) => [
    index('dashboard_alert_consultant_id_idx').on(t.consultantId),
    index('dashboard_alert_pyme_id_idx').on(t.pymeId),
    index('dashboard_alert_status_idx').on(t.status),
    index('dashboard_alert_created_at_idx').on(t.createdAt),
  ],
);

export type DashboardAlert = typeof dashboardAlert.$inferSelect;
export type DashboardAlertDTO = typeof dashboardAlert.$inferInsert;
