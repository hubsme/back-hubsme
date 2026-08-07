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
import { user } from './user.table';

export const SERVICE_REQUEST_CATEGORY_OPTIONS = [
  {
    category: 'Estratégica',
    subcategories: ['Planificación estratégica', 'Modelo de negocio', 'Transformación empresarial'],
  },
  {
    category: 'Financiera',
    subcategories: ['Planeamiento financiero', 'Costos y presupuestos', 'Financiamiento'],
  },
  {
    category: 'Comercial / Ventas',
    subcategories: ['Estrategia comercial', 'Proceso de ventas', 'CRM'],
  },
  {
    category: 'Marketing',
    subcategories: ['Redes sociales', 'Branding / Diseño', 'Marketing digital', 'Investigación de mercado'],
  },
  {
    category: 'Servicio al cliente',
    subcategories: ['Experiencia del cliente', 'Atención y soporte', 'Fidelización'],
  },
  {
    category: 'Operaciones',
    subcategories: ['Mejora de procesos', 'Logística', 'Calidad'],
  },
  {
    category: 'Organizacional / RRHH',
    subcategories: ['Selección', 'Capacitación', 'Cultura y clima'],
  },
  {
    category: 'Tecnología',
    subcategories: ['Desarrollo web', 'Software / Automatización', 'Datos / Analítica', 'Ciberseguridad'],
  },
  {
    category: 'Legal',
    subcategories: ['Contratos', 'Corporativo', 'Propiedad intelectual'],
  },
  {
    category: 'Laboral',
    subcategories: ['Cumplimiento laboral', 'Gestión de planillas', 'Seguridad y salud en el trabajo'],
  },
  {
    category: 'Tributario / Contable',
    subcategories: ['Contabilidad', 'Declaraciones tributarias', 'Facturación / SUNAT', 'Auditoría'],
  },
] as const;

export const SERVICE_REQUEST_CATEGORIES = [
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
] as const;

export const SERVICE_REQUEST_BUDGET_TYPES = ['fixed', 'range'] as const;
export const SERVICE_REQUEST_WORK_MODALITIES = ['remote'] as const;

export type ServiceRequestCategory = (typeof SERVICE_REQUEST_CATEGORIES)[number];
export type ServiceRequestBudgetType = (typeof SERVICE_REQUEST_BUDGET_TYPES)[number];
export type ServiceRequestWorkModality = (typeof SERVICE_REQUEST_WORK_MODALITIES)[number];

export type ServiceRequestMilestone = {
  title: string;
  dueDate: string;
};

export type ServiceRequestReferenceAttachment = {
  storagePath: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export const serviceRequestStatusEnum = pgEnum('service_request_status', [
  'requested',
  'proposal_sent',
  'consultant_declined',
  'payment_pending',
  'paid',
  'pyme_declined',
  'cancelled',
]);

export const serviceRequestCategoryEnum = pgEnum('service_request_category', SERVICE_REQUEST_CATEGORIES);
export const serviceRequestBudgetTypeEnum = pgEnum('service_request_budget_type', SERVICE_REQUEST_BUDGET_TYPES);
export const serviceRequestWorkModalityEnum = pgEnum('service_request_work_modality', SERVICE_REQUEST_WORK_MODALITIES);

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
    category: serviceRequestCategoryEnum('category'),
    subcategory: varchar('subcategory', { length: 120 }),
    description: text('description').notNull(),
    expectedOutcome: text('expected_outcome'),
    requirements: text('requirements').notNull(),
    deliverables: text('deliverables').array().default([]).notNull(),
    exclusions: text('exclusions'),
    referenceUrls: text('reference_urls').array().default([]).notNull(),
    referenceAttachments: jsonb('reference_attachments')
      .$type<ServiceRequestReferenceAttachment[]>()
      .default([])
      .notNull(),
    budgetType: serviceRequestBudgetTypeEnum('budget_type'),
    budgetMin: decimal('budget_min', { precision: 12, scale: 2 }),
    budgetMax: decimal('budget_max', { precision: 12, scale: 2 }),
    deadline: date('deadline', { mode: 'string' }),
    estimatedDuration: varchar('estimated_duration', { length: 160 }),
    workModality: serviceRequestWorkModalityEnum('work_modality').default('remote').notNull(),
    workMethod: text('work_method'),
    milestones: jsonb('milestones').$type<ServiceRequestMilestone[]>().default([]).notNull(),
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
      'service_request_budget_positive_check',
      sql`(${t.budgetMin} IS NULL OR ${t.budgetMin} > 0) AND (${t.budgetMax} IS NULL OR ${t.budgetMax} > 0)`,
    ),
    check(
      'service_request_budget_range_check',
      sql`${t.budgetMin} IS NULL OR ${t.budgetMax} IS NULL OR ${t.budgetMax} >= ${t.budgetMin}`,
    ),
    check(
      'service_request_proposal_price_check',
      sql`${t.status} NOT IN ('proposal_sent', 'payment_pending', 'paid') OR ${t.proposedPrice} IS NOT NULL`,
    ),
  ],
);

export type ServiceRequest = typeof serviceRequest.$inferSelect;
export type ServiceRequestDTO = typeof serviceRequest.$inferInsert;
