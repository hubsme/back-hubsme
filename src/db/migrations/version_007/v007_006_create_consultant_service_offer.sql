DO $$
BEGIN
  CREATE TYPE "consultant_service_offer_price_period" AS ENUM ('one_time', 'monthly', 'hourly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "consultant_service_offer" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "consultant_id" integer NOT NULL REFERENCES "consultant"("id") ON DELETE CASCADE,
  "title" varchar(160) NOT NULL,
  "category" "service_request_category" NOT NULL,
  "subcategory" varchar(120) NOT NULL,
  "description" text NOT NULL,
  "expected_outcome" text NOT NULL,
  "requirements" text NOT NULL,
  "deliverables" text[] DEFAULT '{}'::text[] NOT NULL,
  "exclusions" text,
  "estimated_duration_days" integer NOT NULL,
  "work_modality" "service_request_work_modality" DEFAULT 'remote' NOT NULL,
  "work_method" text NOT NULL,
  "price" numeric(12, 2) NOT NULL,
  "currency" varchar(10) DEFAULT 'PEN' NOT NULL,
  "price_period" "consultant_service_offer_price_period" DEFAULT 'one_time' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  CONSTRAINT "consultant_service_offer_price_positive_check" CHECK ("price" > 0),
  CONSTRAINT "consultant_service_offer_duration_check" CHECK (
    "estimated_duration_days" >= 1 AND "estimated_duration_days" <= 365
  )
);

CREATE INDEX IF NOT EXISTS "consultant_service_offer_consultant_id_idx"
  ON "consultant_service_offer" ("consultant_id");
CREATE INDEX IF NOT EXISTS "consultant_service_offer_category_idx"
  ON "consultant_service_offer" ("category");
CREATE INDEX IF NOT EXISTS "consultant_service_offer_active_idx"
  ON "consultant_service_offer" ("is_active");
CREATE INDEX IF NOT EXISTS "consultant_service_offer_created_at_idx"
  ON "consultant_service_offer" ("created_at");
CREATE INDEX IF NOT EXISTS "consultant_service_offer_title_idx"
  ON "consultant_service_offer" USING gin ("title" gin_trgm_ops);

ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "service_offer_id" integer;

DO $$
BEGIN
  ALTER TABLE "service_request"
    ADD CONSTRAINT "service_request_service_offer_id_fk"
    FOREIGN KEY ("service_offer_id") REFERENCES "consultant_service_offer"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "service_request_service_offer_id_idx"
  ON "service_request" ("service_offer_id");
