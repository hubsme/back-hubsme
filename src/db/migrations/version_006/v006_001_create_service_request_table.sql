DO $$
BEGIN
  IF to_regclass('public.service_request') IS NULL
    AND to_regclass('public.quotation') IS NOT NULL THEN
    ALTER TABLE "quotation" RENAME TO "service_request";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'quotation_status'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'service_request_status'
  ) THEN
    ALTER TYPE "quotation_status" RENAME TO "service_request_status";
  END IF;
END
$$;

DO $$
BEGIN
  CREATE TYPE "service_request_status" AS ENUM (
    'requested',
    'proposal_sent',
    'consultant_declined',
    'payment_pending',
    'paid',
    'pyme_declined',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
DECLARE
  status_rename record;
  column_rename record;
  constraint_rename record;
  index_rename record;
  target_name text;
BEGIN
  FOR status_rename IN
    SELECT *
    FROM (
      VALUES
        ('sent', 'requested'),
        ('quoted', 'proposal_sent'),
        ('consultant_rejected', 'consultant_declined'),
        ('pyme_rejected', 'pyme_declined')
    ) AS status_names(old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_type enum_type
      INNER JOIN pg_enum enum_value ON enum_value.enumtypid = enum_type.oid
      WHERE enum_type.typname = 'service_request_status'
        AND enum_value.enumlabel = status_rename.old_name
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_type enum_type
      INNER JOIN pg_enum enum_value ON enum_value.enumtypid = enum_type.oid
      WHERE enum_type.typname = 'service_request_status'
        AND enum_value.enumlabel = status_rename.new_name
    ) THEN
      EXECUTE format(
        'ALTER TYPE "service_request_status" RENAME VALUE %L TO %L',
        status_rename.old_name,
        status_rename.new_name
      );
    END IF;
  END LOOP;

  IF to_regclass('public.service_request') IS NOT NULL THEN
    FOR column_rename IN
      SELECT *
      FROM (
        VALUES
          ('consultant_price', 'proposed_price'),
          ('consultant_message', 'proposal_message')
      ) AS column_names(old_name, new_name)
    LOOP
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'service_request'
          AND column_name = column_rename.old_name
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'service_request'
          AND column_name = column_rename.new_name
      ) THEN
        EXECUTE format(
          'ALTER TABLE "service_request" RENAME COLUMN %I TO %I',
          column_rename.old_name,
          column_rename.new_name
        );
      END IF;
    END LOOP;

    FOR constraint_rename IN
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'service_request'
        AND constraint_name LIKE 'quotation_%'
    LOOP
      target_name := regexp_replace(constraint_rename.constraint_name, '^quotation_', 'service_request_');
      IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'service_request'
          AND constraint_name = target_name
      ) THEN
        EXECUTE format(
          'ALTER TABLE "service_request" RENAME CONSTRAINT %I TO %I',
          constraint_rename.constraint_name,
          target_name
        );
      END IF;
    END LOOP;

    FOR index_rename IN
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'service_request'
        AND indexname LIKE 'quotation_%'
    LOOP
      target_name := regexp_replace(index_rename.indexname, '^quotation_', 'service_request_');
      IF to_regclass('public.' || quote_ident(target_name)) IS NULL THEN
        EXECUTE format('ALTER INDEX %I RENAME TO %I', index_rename.indexname, target_name);
      END IF;
    END LOOP;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "service_request" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "pyme_id" integer NOT NULL REFERENCES "app_user"("id"),
  "consultant_id" integer NOT NULL REFERENCES "app_user"("id"),
  "title" varchar(160) NOT NULL,
  "description" text NOT NULL,
  "requirements" text NOT NULL,
  "details" text,
  "status" "service_request_status" DEFAULT 'requested' NOT NULL,
  "proposed_price" decimal(12, 2),
  "currency" varchar(10) DEFAULT 'PEN' NOT NULL,
  "proposal_message" text,
  "pyme_decision_message" text,
  "responded_at" timestamp,
  "decided_at" timestamp,
  "paid_at" timestamp,
  CONSTRAINT "service_request_participants_check" CHECK ("pyme_id" <> "consultant_id"),
  CONSTRAINT "service_request_price_positive_check" CHECK (
    "proposed_price" IS NULL OR "proposed_price" > 0
  ),
  CONSTRAINT "service_request_proposal_price_check" CHECK (
    "status" NOT IN ('proposal_sent', 'payment_pending', 'paid')
    OR "proposed_price" IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS "service_request_pyme_id_idx"
  ON "service_request" ("pyme_id");

CREATE INDEX IF NOT EXISTS "service_request_consultant_id_idx"
  ON "service_request" ("consultant_id");

CREATE INDEX IF NOT EXISTS "service_request_status_idx"
  ON "service_request" ("status");

CREATE INDEX IF NOT EXISTS "service_request_created_at_idx"
  ON "service_request" ("created_at");

CREATE INDEX IF NOT EXISTS "service_request_updated_at_idx"
  ON "service_request" ("updated_at");

CREATE INDEX IF NOT EXISTS "service_request_title_idx"
  ON "service_request" USING gin ("title" gin_trgm_ops);
