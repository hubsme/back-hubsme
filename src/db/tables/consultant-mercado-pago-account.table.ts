import { index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';

export const consultantMercadoPagoAccount = pgTable(
  'consultant_mercado_pago_account',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    mercadoPagoUserId: varchar('mercado_pago_user_id', { length: 120 }).notNull(),
    nickname: varchar('nickname', { length: 180 }),
    email: varchar('email', { length: 255 }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token').notNull(),
    tokenExpiresAt: timestamp('token_expires_at'),
    scope: text('scope'),
    connectedAt: timestamp('connected_at').defaultNow().notNull(),
  },
  (t) => [
    index('consultant_mercado_pago_account_consultant_id_idx').on(t.consultantId),
    index('consultant_mercado_pago_account_user_id_idx').on(t.mercadoPagoUserId),
    uniqueIndex('consultant_mercado_pago_account_consultant_unique_active_idx')
      .on(t.consultantId)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type ConsultantMercadoPagoAccount = typeof consultantMercadoPagoAccount.$inferSelect;
export type ConsultantMercadoPagoAccountDTO = typeof consultantMercadoPagoAccount.$inferInsert;
