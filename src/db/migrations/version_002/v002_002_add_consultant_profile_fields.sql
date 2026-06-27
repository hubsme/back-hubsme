ALTER TABLE "consultant"
  ADD COLUMN IF NOT EXISTS "headline" varchar(240),
  ADD COLUMN IF NOT EXISTS "location" varchar(160),
  ADD COLUMN IF NOT EXISTS "work_modality" varchar(160),
  ADD COLUMN IF NOT EXISTS "linkedin_url" text,
  ADD COLUMN IF NOT EXISTS "industries" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "company_types" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "services" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "years_experience" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "education" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "certifications" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "worked_sectors" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "case_studies" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "cv_text" text;

CREATE INDEX IF NOT EXISTS "consultant_industries_idx" ON "consultant" USING gin ("industries");
CREATE INDEX IF NOT EXISTS "consultant_company_types_idx" ON "consultant" USING gin ("company_types");
CREATE INDEX IF NOT EXISTS "consultant_services_idx" ON "consultant" USING gin ("services");
CREATE INDEX IF NOT EXISTS "consultant_worked_sectors_idx" ON "consultant" USING gin ("worked_sectors");
