DO $$
BEGIN
  CREATE TYPE "checkout_collection_destination" AS ENUM ('consultant', 'hubsme');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "checkout"
  ADD COLUMN IF NOT EXISTS "collection_destination" "checkout_collection_destination";

-- Los servicios ya se cobraban en la cuenta de Hubsme. Las consultorías históricas
-- usaban split y se conservan como pagos directos al consultor para no generar deuda duplicada.
UPDATE "checkout"
SET "collection_destination" = CASE
  WHEN "service_request_id" IS NOT NULL THEN 'hubsme'::"checkout_collection_destination"
  ELSE 'consultant'::"checkout_collection_destination"
END
WHERE "collection_destination" IS NULL;

ALTER TABLE "checkout"
  ALTER COLUMN "collection_destination" SET DEFAULT 'hubsme',
  ALTER COLUMN "collection_destination" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "checkout_collection_destination_idx"
  ON "checkout" ("collection_destination");

DO $$
BEGIN
  CREATE TYPE "meeting_consultant_payout_status" AS ENUM ('pending', 'paid');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "meeting_consultant_payout" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "meeting_id" integer NOT NULL,
  "checkout_id" integer NOT NULL,
  "pyme_id" integer NOT NULL,
  "consultant_id" integer NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "currency" varchar(10) DEFAULT 'PEN' NOT NULL,
  "status" "meeting_consultant_payout_status" DEFAULT 'pending' NOT NULL,
  "payment_reference" varchar(180),
  "evidence_file_url" text,
  "evidence_storage_path" text,
  "evidence_original_name" varchar(255),
  "evidence_mime_type" varchar(120),
  "evidence_size_bytes" integer,
  "notes" text,
  "paid_at" timestamp,
  "processed_by_admin" varchar(255),
  CONSTRAINT "meeting_consultant_payout_meeting_fk"
    FOREIGN KEY ("meeting_id") REFERENCES "meeting"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_consultant_payout_checkout_fk"
    FOREIGN KEY ("checkout_id") REFERENCES "checkout"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_consultant_payout_pyme_fk"
    FOREIGN KEY ("pyme_id") REFERENCES "app_user"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_consultant_payout_consultant_fk"
    FOREIGN KEY ("consultant_id") REFERENCES "app_user"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_consultant_payout_amount_positive_check"
    CHECK ("amount" > 0),
  CONSTRAINT "meeting_consultant_payout_paid_evidence_check"
    CHECK (
      "status" <> 'paid'
      OR (
        "payment_reference" IS NOT NULL
        AND "evidence_file_url" IS NOT NULL
        AND "evidence_storage_path" IS NOT NULL
        AND "evidence_original_name" IS NOT NULL
        AND "evidence_mime_type" IS NOT NULL
        AND "evidence_size_bytes" IS NOT NULL
        AND "paid_at" IS NOT NULL
        AND "processed_by_admin" IS NOT NULL
      )
  )
);

COMMENT ON TABLE "meeting_consultant_payout" IS
  'Obligaciones y evidencias de depósitos manuales de Hubsme a consultores por reuniones pagadas';

COMMENT ON COLUMN "meeting_consultant_payout"."amount" IS
  'Monto neto a depositar al consultor después de la comisión contable de Hubsme';

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_consultant_payout_meeting_unique_idx"
  ON "meeting_consultant_payout" ("meeting_id");

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_consultant_payout_checkout_unique_idx"
  ON "meeting_consultant_payout" ("checkout_id");

CREATE INDEX IF NOT EXISTS "meeting_consultant_payout_consultant_id_idx"
  ON "meeting_consultant_payout" ("consultant_id");

CREATE INDEX IF NOT EXISTS "meeting_consultant_payout_pyme_id_idx"
  ON "meeting_consultant_payout" ("pyme_id");

CREATE INDEX IF NOT EXISTS "meeting_consultant_payout_status_idx"
  ON "meeting_consultant_payout" ("status");

CREATE INDEX IF NOT EXISTS "meeting_consultant_payout_created_at_idx"
  ON "meeting_consultant_payout" ("created_at");
