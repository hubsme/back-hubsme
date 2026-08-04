import { sql } from 'drizzle-orm';
import { check, decimal, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { user } from './user.table';

export const serviceRequestStatusEnum = pgEnum('service_request_status', [
  'requested',
  'proposal_sent',
  'consultant_declined',
  'payment_pending',
  'paid',
  'pyme_declined',
  'cancelled',
]);

export const serviceRequest = pgTable(
  'service_request',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    pymeId: integer('pyme_id')
      .notNull()
      .references(() => user.id),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => user.id),
    title: varchar('title', { length: 160 }).notNull(),
    description: text('description').notNull(),
    requirements: text('requirements').notNull(),
    details: text('details'),
    status: serviceRequestStatusEnum('status').default('requested').notNull(),
    proposedPrice: decimal('proposed_price', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    proposalMessage: text('proposal_message'),
    pymeDecisionMessage: text('pyme_decision_message'),
    respondedAt: timestamp('responded_at'),
    decidedAt: timestamp('decided_at'),
    paidAt: timestamp('paid_at'),
  },
  (t) => [
    index('service_request_pyme_id_idx').on(t.pymeId),
    index('service_request_consultant_id_idx').on(t.consultantId),
    index('service_request_status_idx').on(t.status),
    index('service_request_created_at_idx').on(t.createdAt),
    index('service_request_updated_at_idx').on(t.updatedAt),
    index('service_request_title_idx').using('gin', t.title.op('gin_trgm_ops')),
    check('service_request_participants_check', sql`${t.pymeId} <> ${t.consultantId}`),
    check('service_request_price_positive_check', sql`${t.proposedPrice} IS NULL OR ${t.proposedPrice} > 0`),
    check(
      'service_request_proposal_price_check',
      sql`${t.status} NOT IN ('proposal_sent', 'payment_pending', 'paid') OR ${t.proposedPrice} IS NOT NULL`,
    ),
  ],
);

export type ServiceRequest = typeof serviceRequest.$inferSelect;
export type ServiceRequestDTO = typeof serviceRequest.$inferInsert;
