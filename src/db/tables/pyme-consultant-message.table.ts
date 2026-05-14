import { pgTable, serial, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { pymeConsultantMatch } from './pyme-consultant-match.table';
import { user } from './user.table';

export const pymeConsultantMessage = pgTable(
  'pyme_consultant_message',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    matchId: integer('match_id')
      .notNull()
      .references(() => pymeConsultantMatch.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    readAt: timestamp('read_at'),
  },
  (t) => [
    index('pyme_consultant_message_match_id_idx').on(t.matchId),
    index('pyme_consultant_message_sender_id_idx').on(t.senderId),
    index('pyme_consultant_message_created_at_idx').on(t.createdAt),
  ],
);

export type PymeConsultantMessage = typeof pymeConsultantMessage.$inferSelect;
export type PymeConsultantMessageDTO = typeof pymeConsultantMessage.$inferInsert;
