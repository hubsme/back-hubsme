DO $$
DECLARE
  constraint_rename record;
  index_rename record;
  target_name text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mercado_pago_payment'
      AND column_name = 'quotation_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'mercado_pago_payment'
      AND column_name = 'service_request_id'
  ) THEN
    ALTER TABLE "mercado_pago_payment"
      RENAME COLUMN "quotation_id" TO "service_request_id";
  END IF;

  FOR constraint_rename IN
    SELECT constraint_name
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'mercado_pago_payment'
      AND constraint_name LIKE '%quotation%'
  LOOP
    target_name := replace(constraint_rename.constraint_name, 'quotation', 'service_request');
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'mercado_pago_payment'
        AND constraint_name = target_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE "mercado_pago_payment" RENAME CONSTRAINT %I TO %I',
        constraint_rename.constraint_name,
        target_name
      );
    END IF;
  END LOOP;

  FOR index_rename IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'mercado_pago_payment'
      AND indexname LIKE '%quotation%'
  LOOP
    target_name := replace(index_rename.indexname, 'quotation', 'service_request');
    IF to_regclass('public.' || quote_ident(target_name)) IS NULL THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I', index_rename.indexname, target_name);
    END IF;
  END LOOP;
END
$$;

ALTER TABLE "mercado_pago_payment"
  ADD COLUMN IF NOT EXISTS "service_request_id" integer REFERENCES "service_request"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "mercado_pago_payment_service_request_id_idx"
  ON "mercado_pago_payment" ("service_request_id");

CREATE UNIQUE INDEX IF NOT EXISTS "mercado_pago_payment_service_request_unique_active_idx"
  ON "mercado_pago_payment" ("service_request_id")
  WHERE "deleted_at" IS NULL AND "service_request_id" IS NOT NULL;
