import { pgTable, serial, text, timestamp, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { user } from './user.table';
import { meeting } from './meeting.table';

export const taskAssignedToEnum = pgEnum('task_assigned_to', ['pyme', 'consultor']);
export const taskPriorityEnum = pgEnum('task_priority', ['alta', 'media', 'baja']);
export const taskStatusEnum = pgEnum('task_status', ['pendiente', 'en_progreso', 'completada', 'bloqueada']);

export const task = pgTable(
  'task',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    meetingId: integer('meeting_id').references(() => meeting.id, { onDelete: 'cascade' }),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    consultantId: integer('consultant_id').references(() => user.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    assignedTo: taskAssignedToEnum('assigned_to').default('pyme').notNull(),
    priority: taskPriorityEnum('priority').default('media').notNull(),
    status: taskStatusEnum('status').default('pendiente').notNull(),
    dueDate: timestamp('due_date'),
  },
  (t) => [
    index('task_title_idx').using('gin', t.title.op('gin_trgm_ops')),
    index('task_meeting_id_idx').on(t.meetingId),
    index('task_pyme_id_idx').on(t.pymeId),
    index('task_consultant_id_idx').on(t.consultantId),
    index('task_status_idx').on(t.status),
    index('task_priority_idx').on(t.priority),
    index('task_due_date_idx').on(t.dueDate),
  ],
);

export type Task = typeof task.$inferSelect;
export type TaskDTO = typeof task.$inferInsert;
