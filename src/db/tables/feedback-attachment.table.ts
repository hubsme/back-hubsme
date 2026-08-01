import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { feedback } from './feedback.table';

export const feedbackAttachment = pgTable(
  'feedback_attachment',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    feedbackId: integer('feedback_id')
      .notNull()
      .references(() => feedback.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    fileUrl: text('file_url').notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
  },
  (t) => [
    index('feedback_attachment_feedback_id_idx').on(t.feedbackId),
    index('feedback_attachment_created_at_idx').on(t.createdAt),
    check('feedback_attachment_size_positive', sql`${t.sizeBytes} > 0`),
  ],
);

export type FeedbackAttachment = typeof feedbackAttachment.$inferSelect;
export type FeedbackAttachmentDTO = typeof feedbackAttachment.$inferInsert;
