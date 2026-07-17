import { decimal, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { meeting } from './meeting.table';
import { user } from './user.table';

export const mercadoPagoPaymentStatusEnum = pgEnum('mercado_pago_payment_status', [
  'created',
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
]);

export type MercadoPagoPaymentRaw = Record<string, unknown>;

export const mercadoPagoPayment = pgTable(
  'mercado_pago_payment',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    meetingId: integer('meeting_id')
      .references(() => meeting.id, { onDelete: 'cascade' }),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id),
    preferenceId: varchar('preference_id', { length: 180 }),
    initPoint: text('init_point'),
    sandboxInitPoint: text('sandbox_init_point'),
    externalReference: varchar('external_reference', { length: 180 }).notNull(),
    mercadoPagoPaymentId: varchar('mercado_pago_payment_id', { length: 180 }),
    status: mercadoPagoPaymentStatusEnum('status').default('created').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    marketplaceFee: decimal('marketplace_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    rawPayment: jsonb('raw_payment').$type<MercadoPagoPaymentRaw>(),
    meetingDetails: jsonb('meeting_details').$type<{
      startTime: string;
      proposedStartTimes?: string[];
      durationMinutes: number;
      title: string;
      description?: string;
    }>(),
  },
  (t) => [
    index('mercado_pago_payment_meeting_id_idx').on(t.meetingId),
    index('mercado_pago_payment_preference_id_idx').on(t.preferenceId),
    index('mercado_pago_payment_external_reference_idx').on(t.externalReference),
    index('mercado_pago_payment_status_idx').on(t.status),
    uniqueIndex('mercado_pago_payment_meeting_unique_active_idx')
      .on(t.meetingId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.meetingId} IS NOT NULL`),
  ],
);

export type MercadoPagoPayment = typeof mercadoPagoPayment.$inferSelect;
export type MercadoPagoPaymentDTO = typeof mercadoPagoPayment.$inferInsert;
