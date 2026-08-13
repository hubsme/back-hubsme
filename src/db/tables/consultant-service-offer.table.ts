import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { consultant } from './consultant.table';
import { serviceRequestCategoryEnum, serviceRequestWorkModalityEnum } from './service-request.table';

export const CONSULTANT_SERVICE_OFFER_PRICE_PERIODS = ['one_time', 'monthly', 'hourly'] as const;
export type ConsultantServiceOfferPricePeriod = (typeof CONSULTANT_SERVICE_OFFER_PRICE_PERIODS)[number];

export const consultantServiceOfferPricePeriodEnum = pgEnum(
  'consultant_service_offer_price_period',
  CONSULTANT_SERVICE_OFFER_PRICE_PERIODS,
);

export const consultantServiceOffer = pgTable(
  'consultant_service_offer',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    consultantId: integer('consultant_id')
      .notNull()
      .references(() => consultant.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 160 }).notNull(),
    category: serviceRequestCategoryEnum('category').notNull(),
    subcategory: varchar('subcategory', { length: 120 }).notNull(),
    description: text('description').notNull(),
    expectedOutcome: text('expected_outcome').notNull(),
    requirements: text('requirements').notNull(),
    deliverables: text('deliverables').array().default([]).notNull(),
    exclusions: text('exclusions'),
    estimatedDurationDays: integer('estimated_duration_days').notNull(),
    workModality: serviceRequestWorkModalityEnum('work_modality').default('remote').notNull(),
    workMethod: text('work_method').notNull(),
    price: decimal('price', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('PEN').notNull(),
    pricePeriod: consultantServiceOfferPricePeriodEnum('price_period').default('one_time').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (t) => [
    index('consultant_service_offer_consultant_id_idx').on(t.consultantId),
    index('consultant_service_offer_category_idx').on(t.category),
    index('consultant_service_offer_active_idx').on(t.isActive),
    index('consultant_service_offer_created_at_idx').on(t.createdAt),
    index('consultant_service_offer_title_idx').using('gin', t.title.op('gin_trgm_ops')),
    check('consultant_service_offer_price_positive_check', sql`${t.price} > 0`),
    check(
      'consultant_service_offer_duration_check',
      sql`${t.estimatedDurationDays} >= 1 AND ${t.estimatedDurationDays} <= 365`,
    ),
  ],
);

export type ConsultantServiceOffer = typeof consultantServiceOffer.$inferSelect;
export type ConsultantServiceOfferDTO = typeof consultantServiceOffer.$inferInsert;
