import { decimal, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { user } from './user.table';

export const payment = pgTable(
  'payments',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    userId: integer('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'subscription' | 'booking'
    referenceId: text('reference_id'), // plan id or meeting id
    preferenceId: varchar('preference_id', { length: 180 }),
    initPoint: text('init_point'),
    sandboxInitPoint: text('sandbox_init_point'),
    externalReference: varchar('external_reference', { length: 180 }).notNull(),
    mercadoPagoPaymentId: varchar('mercado_pago_payment_id', { length: 180 }),
    status: varchar('status', { length: 50 }).default('created').notNull(), // 'created', 'pending', 'approved', etc.
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    rawPayment: jsonb('raw_payment'),
  }
);

export type Payment = typeof payment.$inferSelect;
export type PaymentDTO = typeof payment.$inferInsert;
