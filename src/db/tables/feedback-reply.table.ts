import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedback } from './feedback.table';
import { user } from './user.table';

export const feedbackReplyAuthorTypeEnum = pgEnum('feedback_reply_author_type', ['user', 'admin']);

export const feedbackReply = pgTable(
  'feedback_reply',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    feedbackId: integer('feedback_id')
      .notNull()
      .references(() => feedback.id, { onDelete: 'cascade' }),
    authorType: feedbackReplyAuthorTypeEnum('author_type').notNull(),
    authorUserId: integer('author_user_id').references(() => user.id),
    authorName: varchar('author_name', { length: 200 }).notNull(),
    message: text('message').notNull(),
  },
  (t) => [
    index('feedback_reply_feedback_id_idx').on(t.feedbackId),
    index('feedback_reply_author_user_id_idx').on(t.authorUserId),
    index('feedback_reply_created_at_idx').on(t.createdAt),
    check(
      'feedback_reply_author_check',
      sql`(${t.authorType} = 'user' AND ${t.authorUserId} IS NOT NULL) OR (${t.authorType} = 'admin' AND ${t.authorUserId} IS NULL)`,
    ),
  ],
);

export type FeedbackReply = typeof feedbackReply.$inferSelect;
export type FeedbackReplyDTO = typeof feedbackReply.$inferInsert;
