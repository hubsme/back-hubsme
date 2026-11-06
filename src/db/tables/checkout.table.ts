import { meeting } from '@db/tables/meeting.table';
import { serviceRequest } from '@db/tables/service-request.table';
import { user } from '@db/tables/user.table';
import { sql } from 'drizzle-orm';
import {
  check,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const checkoutStatusEnum = pgEnum('checkout_status', [
  'created',
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
]);

export const checkoutCollectionDestinationEnum = pgEnum('checkout_collection_destination', ['consultant', 'hubsme']);

export const checkout = pgTable(
  'checkout',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    meetingId: integer('meeting_id').references(() => meeting.id, { onDelete: 'cascade' }),
    serviceRequestId: integer('service_request_id').references(() => serviceRequest.id, { onDelete: 'cascade' }),
    serviceInstallmentIndex: integer('service_installment_index'),
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
    status: checkoutStatusEnum('status').default('created').notNull(),
    collectionDestination: checkoutCollectionDestinationEnum('collection_destination').default('hubsme').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    marketplaceFee: decimal('marketplace_fee', { precision: 10, scale: 2 }).default('0.00').notNull(),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    rawPayment: jsonb('raw_payment').$type<Record<string, unknown>>(),
    meetingDetails: jsonb('meeting_details').$type<{
      startTime: string;
      proposedStartTimes?: string[];
      durationMinutes: number;
      title: string;
      description?: string;
    }>(),
  },
  (t) => [
    index('checkout_meeting_id_idx').on(t.meetingId),
    index('checkout_service_request_id_idx').on(t.serviceRequestId),
    index('checkout_preference_id_idx').on(t.preferenceId),
    index('checkout_external_reference_idx').on(t.externalReference),
    index('checkout_status_idx').on(t.status),
    index('checkout_collection_destination_idx').on(t.collectionDestination),
    uniqueIndex('checkout_meeting_unique_active_idx')
      .on(t.meetingId)
      .where(sql`${t.deletedAt} IS NULL AND ${t.meetingId} IS NOT NULL`),
    uniqueIndex('checkout_service_request_installment_unique_active_idx')
      .on(t.serviceRequestId, t.serviceInstallmentIndex)
      .where(sql`${t.deletedAt} IS NULL AND ${t.serviceRequestId} IS NOT NULL`),
    check(
      'checkout_service_installment_presence_check',
      sql`(${t.serviceRequestId} IS NULL AND ${t.serviceInstallmentIndex} IS NULL)
        OR (${t.serviceRequestId} IS NOT NULL AND ${t.serviceInstallmentIndex} IS NOT NULL)`,
    ),
  ],
);
