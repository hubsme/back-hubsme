import { sql } from 'drizzle-orm';
import {
  check,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { checkout } from './checkout.table';
import { meeting } from './meeting.table';
import { user } from './user.table';

export const meetingConsultantPayoutStatusEnum = pgEnum('meeting_consultant_payout_status', ['pending', 'paid']);

export const meetingConsultantPayout = pgTable(
  'meeting_consultant_payout',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    meetingId: integer('meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'restrict' }),
    checkoutId: integer('checkout_id')
      .notNull()
      .references(() => checkout.id, { onDelete: 'restrict' }),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    mercadoPagoFeeAmount: decimal('mercado_pago_fee_amount', { precision: 10, scale: 2 }),
    mercadoPagoFeePercent: decimal('mercado_pago_fee_percent', { precision: 7, scale: 4 }),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    status: meetingConsultantPayoutStatusEnum('status').default('pending').notNull(),
    paymentReference: varchar('payment_reference', { length: 180 }),
    evidenceFileUrl: text('evidence_file_url'),
    evidenceStoragePath: text('evidence_storage_path'),
    evidenceOriginalName: varchar('evidence_original_name', { length: 255 }),
    evidenceMimeType: varchar('evidence_mime_type', { length: 120 }),
    evidenceSizeBytes: integer('evidence_size_bytes'),
    notes: text('notes'),
    paidAt: timestamp('paid_at'),
    processedByAdmin: varchar('processed_by_admin', { length: 255 }),
  },
  (t) => [
    uniqueIndex('meeting_consultant_payout_meeting_unique_idx').on(t.meetingId),
    uniqueIndex('meeting_consultant_payout_checkout_unique_idx').on(t.checkoutId),
    index('meeting_consultant_payout_consultant_id_idx').on(t.consultantId),
    index('meeting_consultant_payout_pyme_id_idx').on(t.pymeId),
    index('meeting_consultant_payout_status_idx').on(t.status),
    index('meeting_consultant_payout_created_at_idx').on(t.createdAt),
    check('meeting_consultant_payout_amount_positive_check', sql`${t.amount} > 0`),
    check(
      'meeting_consultant_payout_paid_evidence_check',
      sql`${t.status} <> 'paid'
        OR (
          ${t.paymentReference} IS NOT NULL
          AND ${t.evidenceFileUrl} IS NOT NULL
          AND ${t.evidenceStoragePath} IS NOT NULL
          AND ${t.evidenceOriginalName} IS NOT NULL
          AND ${t.evidenceMimeType} IS NOT NULL
          AND ${t.evidenceSizeBytes} IS NOT NULL
          AND ${t.paidAt} IS NOT NULL
          AND ${t.processedByAdmin} IS NOT NULL
        )`,
    ),
  ],
);

export type MeetingConsultantPayout = typeof meetingConsultantPayout.$inferSelect;
export type MeetingConsultantPayoutDTO = typeof meetingConsultantPayout.$inferInsert;
