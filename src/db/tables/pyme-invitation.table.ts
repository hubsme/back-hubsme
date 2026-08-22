import { index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pyme } from './pyme.table';
import { user } from './user.table';
import { pymeMemberRoleEnum } from './pyme-member.table';

export const pymeInvitationStatusEnum = pgEnum('pyme_invitation_status', ['pending', 'accepted', 'revoked']);

export const pymeInvitation = pgTable(
  'pyme_invitation',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => pyme.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: pymeMemberRoleEnum('role').default('member').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    status: pymeInvitationStatusEnum('status').default('pending').notNull(),
    invitedByUserId: integer('invited_by_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    expiresAt: timestamp('expires_at').notNull(),
    acceptedAt: timestamp('accepted_at'),
  },
  (t) => [
    index('pyme_invitation_pyme_id_idx').on(t.pymeId),
    index('pyme_invitation_email_idx').on(t.email),
    index('pyme_invitation_status_idx').on(t.status),
    index('pyme_invitation_expires_at_idx').on(t.expiresAt),
    uniqueIndex('pyme_invitation_token_hash_unique_idx').on(t.tokenHash),
    uniqueIndex('pyme_invitation_pyme_email_pending_unique_idx')
      .on(t.pymeId, t.email)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'pending'`),
  ],
);

export type PymeInvitation = typeof pymeInvitation.$inferSelect;
export type PymeInvitationDTO = typeof pymeInvitation.$inferInsert;
