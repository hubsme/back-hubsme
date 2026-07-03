import { pgTable, text, varchar, timestamp, integer, decimal, index, uniqueIndex, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './user.table';
import { CONSULTANT_DIAGNOSTIC_AREAS } from '@core/consultant-diagnostic-area';

export const consultantDiagnosticAreaEnum = pgEnum(
  'consultant_diagnostic_area',
  CONSULTANT_DIAGNOSTIC_AREAS,
);

export type ConsultantEducationItem = {
  degree: string;
  institution?: string;
  year?: string;
};

export type ConsultantCaseStudy = {
  title: string;
  problem?: string;
  action?: string;
  result?: string;
  sector?: string;
};

export const consultant = pgTable(
  'consultant',
  {
    id: integer('id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    fullName: varchar('full_name', { length: 240 }).notNull(),
    firstName: varchar('first_name', { length: 120 }),
    lastName: varchar('last_name', { length: 120 }),
    ownerPhone: varchar('owner_phone', { length: 30 }),
    headline: varchar('headline', { length: 240 }),
    location: varchar('location', { length: 160 }),
    workModality: varchar('work_modality', { length: 160 }),
    linkedinUrl: text('linkedin_url'),
    bio: text('bio'),
    diagnosticAreas: consultantDiagnosticAreaEnum('diagnostic_areas').array().default([]).notNull(),
    specialties: text('specialties').array().default([]).notNull(),
    sectors: text('sectors').array().default([]).notNull(),
    industries: text('industries').array().default([]).notNull(),
    companyTypes: text('company_types').array().default([]).notNull(),
    services: text('services').array().default([]).notNull(),
    yearsExperience: integer('years_experience').default(0).notNull(),
    education: jsonb('education').$type<ConsultantEducationItem[]>().default([]).notNull(),
    certifications: text('certifications').array().default([]).notNull(),
    workedSectors: text('worked_sectors').array().default([]).notNull(),
    caseStudies: jsonb('case_studies').$type<ConsultantCaseStudy[]>().default([]).notNull(),
    cvText: text('cv_text'),
    cvUrl: text('cv_url'),
    photoUrl: text('photo_url'),
    videoUrl: text('video_url'),
    pricePerHour: decimal('price_per_hour', { precision: 10, scale: 2 }).default('0.00').notNull(),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
    totalReviews: integer('total_reviews').default(0).notNull(),
    active: varchar('active', { length: 10 }).default('true').notNull(),
    validated: varchar('validated', { length: 10 }).default('false').notNull(),
  },
  (t) => [
    index('consultant_full_name_idx').using('gin', t.fullName.op('gin_trgm_ops')),
    index('consultant_first_name_idx').using('gin', t.firstName.op('gin_trgm_ops')),
    index('consultant_last_name_idx').using('gin', t.lastName.op('gin_trgm_ops')),
    index('consultant_diagnostic_areas_idx').using('gin', t.diagnosticAreas),
    index('consultant_specialties_idx').using('gin', t.specialties),
    index('consultant_sectors_idx').using('gin', t.sectors),
    index('consultant_industries_idx').using('gin', t.industries),
    index('consultant_company_types_idx').using('gin', t.companyTypes),
    index('consultant_services_idx').using('gin', t.services),
    index('consultant_worked_sectors_idx').using('gin', t.workedSectors),
    index('consultant_active_idx').on(t.active),
    uniqueIndex('consultant_user_unique_active_idx')
      .on(t.id)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);

export type Consultant = typeof consultant.$inferSelect;
export type ConsultantDTO = typeof consultant.$inferInsert;
