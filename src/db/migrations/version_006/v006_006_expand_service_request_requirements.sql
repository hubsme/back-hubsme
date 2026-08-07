DO $$
BEGIN
  CREATE TYPE "service_request_category" AS ENUM (
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
    'Tributario / Contable'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "service_request_budget_type" AS ENUM ('fixed', 'range');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "service_request_work_modality" AS ENUM ('remote');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "category" "service_request_category",
  ADD COLUMN IF NOT EXISTS "subcategory" varchar(120),
  ADD COLUMN IF NOT EXISTS "expected_outcome" text,
  ADD COLUMN IF NOT EXISTS "deliverables" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "exclusions" text,
  ADD COLUMN IF NOT EXISTS "reference_urls" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "reference_attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS "budget_type" "service_request_budget_type",
  ADD COLUMN IF NOT EXISTS "budget_min" decimal(12, 2),
  ADD COLUMN IF NOT EXISTS "budget_max" decimal(12, 2),
  ADD COLUMN IF NOT EXISTS "deadline" date,
  ADD COLUMN IF NOT EXISTS "estimated_duration" varchar(160),
  ADD COLUMN IF NOT EXISTS "work_modality" "service_request_work_modality" DEFAULT 'remote' NOT NULL,
  ADD COLUMN IF NOT EXISTS "work_method" text,
  ADD COLUMN IF NOT EXISTS "milestones" jsonb DEFAULT '[]'::jsonb NOT NULL;

DO $$
BEGIN
  ALTER TABLE "service_request"
    ADD CONSTRAINT "service_request_budget_positive_check" CHECK (
      ("budget_min" IS NULL OR "budget_min" > 0)
      AND ("budget_max" IS NULL OR "budget_max" > 0)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "service_request"
    ADD CONSTRAINT "service_request_budget_range_check" CHECK (
      "budget_min" IS NULL OR "budget_max" IS NULL OR "budget_max" >= "budget_min"
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
