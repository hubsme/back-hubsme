import { index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { pyme } from './pyme.table';
import { user } from './user.table';

export const pymeMemberRoleEnum = pgEnum('pyme_member_role', ['owner', 'member']);
export const pymeMemberStatusEnum = pgEnum('pyme_member_status', ['active', 'suspended']);

export const pymeMember = pgTable(
  'pyme_member',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => pyme.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: pymeMemberRoleEnum('role').default('member').notNull(),
    status: pymeMemberStatusEnum('status').default('active').notNull(),
  },
  (t) => [
    index('pyme_member_pyme_id_idx').on(t.pymeId),
    index('pyme_member_user_id_idx').on(t.userId),
    index('pyme_member_status_idx').on(t.status),
    uniqueIndex('pyme_member_pyme_user_unique_active_idx')
      .on(t.pymeId, t.userId)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex('pyme_member_user_unique_active_idx')
      .on(t.userId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.status} = 'active'`),
  ],
);

export type PymeMember = typeof pymeMember.$inferSelect;
export type PymeMemberDTO = typeof pymeMember.$inferInsert;
