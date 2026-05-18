import { pgTable, serial, text, varchar, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['admin', 'pyme', 'consultor']);
export const userAuthProviderEnum = pgEnum('user_auth_provider', ['local', 'google']);

export const user = pgTable(
  'app_user',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    email: varchar('email', { length: 255 }).notNull(),
    password: text('password').notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    firstName: varchar('first_name', { length: 120 }),
    lastName: varchar('last_name', { length: 120 }),
    role: userRoleEnum('role').default('pyme').notNull(),
    authProvider: userAuthProviderEnum('auth_provider').default('local').notNull(),
    googleId: varchar('google_id', { length: 255 }),
    isActive: varchar('is_active', { length: 10 }).default('true').notNull(),
  },
  (t) => [
    index('app_user_name_idx').using('gin', t.name.op('gin_trgm_ops')),
    index('app_user_first_name_idx').using('gin', t.firstName.op('gin_trgm_ops')),
    index('app_user_last_name_idx').using('gin', t.lastName.op('gin_trgm_ops')),
    index('app_user_email_idx').on(t.email),
    index('app_user_role_idx').on(t.role),
    index('app_user_auth_provider_idx').on(t.authProvider),
    index('app_user_created_at_idx').on(t.createdAt),
    uniqueIndex('app_user_email_unique_active_idx')
      .on(t.email)
      .where(sql`${t.deletedAt} IS NULL`),
    uniqueIndex('app_user_google_id_unique_active_idx')
      .on(t.googleId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.googleId} IS NOT NULL`),
  ],
);

export type User = typeof user.$inferSelect;
export type UserDTO = typeof user.$inferInsert;
