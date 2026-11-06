import { user } from '@db/tables/user.table';
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const serviceRequestStatusEnum = pgEnum('service_request_status', [
  'requested',
  'proposal_sent',
  'consultant_declined',
  'payment_pending',
  'paid',
  'completed',
  'pyme_declined',
  'cancelled',
]);

export const serviceRequestCategoryEnum = pgEnum('service_request_category', [
  'Estratégica',
  'Financiera',
  'Comercial / Ventas',
  'Marketing',
  'Servicio al cliente',
  'Operaciones',
  'Organizacional / RRHH',
  'Tecnología',
  'Legal',
  'Laboral',
  'Tributario / Contable',
] as const);

export const serviceRequestBudgetTypeEnum = pgEnum('service_request_budget_type', ['fixed', 'range'] as const);

export const serviceRequestWorkModalityEnum = pgEnum('service_request_work_modality', ['remote'] as const);

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
    serviceOfferId: integer('service_offer_id'),
    title: varchar('title', { length: 160 }).notNull(),
    category: serviceRequestCategoryEnum('category'),
    subcategory: varchar('subcategory', { length: 120 }),
    description: text('description').notNull(),
    expectedOutcome: text('expected_outcome'),
    requirements: text('requirements').notNull(),
    deliverables: text('deliverables').array().default([]).notNull(),
    exclusions: text('exclusions'),
    referenceUrls: text('reference_urls').array().default([]).notNull(),
    referenceAttachments: jsonb('reference_attachments')
      .$type<
        {
          storagePath: string;
          fileUrl: string;
          originalName: string;
          mimeType: string;
          sizeBytes: number;
        }[]
      >()
      .default([])
      .notNull(),
    evidenceAttachments: jsonb('evidence_attachments')
      .$type<
        ({
          storagePath: string;
          fileUrl: string;
          originalName: string;
          mimeType: string;
          sizeBytes: number;
        } & {
          id: string;
          note: string | null;
          milestoneIndex: number | null;
          uploadedAt: string;
          uploadedBy: number;
          uploadedByRole: 'pyme' | 'consultor';
        })[]
      >()
      .default([])
      .notNull(),
    budgetType: serviceRequestBudgetTypeEnum('budget_type'),
    budgetMin: decimal('budget_min', { precision: 12, scale: 2 }),
    budgetMax: decimal('budget_max', { precision: 12, scale: 2 }),
    deadline: date('deadline', { mode: 'string' }),
    estimatedDuration: varchar('estimated_duration', { length: 160 }),
    workModality: serviceRequestWorkModalityEnum('work_modality').default('remote').notNull(),
    workMethod: text('work_method'),
    milestones: jsonb('milestones')
      .$type<
        {
          title: string;
          dueDate: string;
        }[]
      >()
      .default([])
      .notNull(),
    paymentPlan: jsonb('payment_plan')
      .$type<{
        strategy: 'single' | 'initial_final' | 'milestone_installments';
        summary: string;
        rationale: string;
        installments: {
          label: string;
          percentage: number;
          trigger: 'service_approval' | 'milestone_completion' | 'service_completion';
          milestoneIndex: number;
        }[];
      }>()
      .default({
        strategy: 'single',
        summary: 'Pago único al aprobar la propuesta',
        rationale: 'El servicio se paga en una sola operación antes de iniciar.',
        installments: [
          {
            label: 'Pago único del servicio',
            percentage: 100,
            trigger: 'service_approval',
            milestoneIndex: 0,
          },
        ],
      })
      .notNull(),
    initialMeetingProposedStartTimes: text('initial_meeting_proposed_start_times').array().default([]).notNull(),
    initialMeetingStartTime: timestamp('initial_meeting_start_time'),
    details: text('details'),
    status: serviceRequestStatusEnum('status').default('requested').notNull(),
    proposedPrice: decimal('proposed_price', { precision: 12, scale: 2 }),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    proposalMessage: text('proposal_message'),
    pymeDecisionMessage: text('pyme_decision_message'),
    respondedAt: timestamp('responded_at'),
    decidedAt: timestamp('decided_at'),
    paidAt: timestamp('paid_at'),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('service_request_pyme_id_idx').on(t.pymeId),
    index('service_request_consultant_id_idx').on(t.consultantId),
    index('service_request_service_offer_id_idx').on(t.serviceOfferId),
    index('service_request_status_idx').on(t.status),
    index('service_request_created_at_idx').on(t.createdAt),
    index('service_request_updated_at_idx').on(t.updatedAt),
    index('service_request_title_idx').using('gin', t.title.op('gin_trgm_ops')),
    check('service_request_participants_check', sql`${t.pymeId} <> ${t.consultantId}`),
    check('service_request_price_positive_check', sql`${t.proposedPrice} IS NULL OR ${t.proposedPrice} > 0`),
    check(
      'service_request_budget_positive_check',
      sql`(${t.budgetMin} IS NULL OR ${t.budgetMin} > 0) AND (${t.budgetMax} IS NULL OR ${t.budgetMax} > 0)`,
    ),
    check(
      'service_request_budget_range_check',
      sql`${t.budgetMin} IS NULL OR ${t.budgetMax} IS NULL OR ${t.budgetMax} >= ${t.budgetMin}`,
    ),
    check(
      'service_request_proposal_price_check',
      sql`${t.status} NOT IN ('proposal_sent', 'payment_pending', 'paid', 'completed') OR ${t.proposedPrice} IS NOT NULL`,
    ),
  ],
);
