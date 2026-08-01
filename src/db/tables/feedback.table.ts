import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { user, userRoleEnum } from './user.table';

export const feedbackStatusEnum = pgEnum('feedback_status', ['new', 'in_review', 'accepted', 'resolved', 'closed']);

export const feedback = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id),
    userRole: userRoleEnum('user_role').notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description').notNull(),
    status: feedbackStatusEnum('status').default('new').notNull(),
    statusUpdatedAt: timestamp('status_updated_at'),
    statusUpdatedBy: varchar('status_updated_by', { length: 120 }),
  },
  (t) => [
    index('feedback_user_id_idx').on(t.userId),
    index('feedback_status_idx').on(t.status),
    index('feedback_created_at_idx').on(t.createdAt),
    index('feedback_updated_at_idx').on(t.updatedAt),
    index('feedback_title_idx').using('gin', t.title.op('gin_trgm_ops')),
    index('feedback_description_idx').using('gin', t.description.op('gin_trgm_ops')),
    check('feedback_user_role_check', sql`${t.userRole} IN ('pyme', 'consultor')`),
  ],
);

export type Feedback = typeof feedback.$inferSelect;
export type FeedbackDTO = typeof feedback.$inferInsert;
