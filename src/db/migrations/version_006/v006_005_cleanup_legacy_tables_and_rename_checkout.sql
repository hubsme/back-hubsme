DROP TABLE IF EXISTS "pyme_consultant_message";
DROP TABLE IF EXISTS "pyme_consultant_match";
DROP TABLE IF EXISTS "payments";

DROP TYPE IF EXISTS "pyme_consultant_match_status";

DO $$
BEGIN
  IF to_regclass('public.mercado_pago_payment') IS NOT NULL
    AND to_regclass('public.checkout') IS NULL THEN
    ALTER TABLE "mercado_pago_payment" RENAME TO "checkout";
  ELSIF to_regclass('public.mercado_pago_payment') IS NOT NULL
    AND to_regclass('public.checkout') IS NOT NULL THEN
    RAISE EXCEPTION 'Both mercado_pago_payment and checkout tables exist; manual reconciliation is required';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mercado_pago_payment_status')
    AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkout_status') THEN
    ALTER TYPE "mercado_pago_payment_status" RENAME TO "checkout_status";
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.mercado_pago_payment_id_seq') IS NOT NULL
    AND to_regclass('public.checkout_id_seq') IS NULL THEN
    ALTER SEQUENCE "mercado_pago_payment_id_seq" RENAME TO "checkout_id_seq";
  END IF;
END
$$;

DO $$
DECLARE
  item record;
  target_name text;
BEGIN
  FOR item IN
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'checkout'
      AND tc.constraint_name LIKE 'mercado_pago_payment%'
  LOOP
    target_name := replace(item.constraint_name, 'mercado_pago_payment', 'checkout');

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'checkout'
        AND constraint_name = target_name
    ) THEN
      EXECUTE format('ALTER TABLE "checkout" RENAME CONSTRAINT %I TO %I', item.constraint_name, target_name);
    END IF;
  END LOOP;
END
$$;

DO $$
DECLARE
  item record;
  target_name text;
BEGIN
  FOR item IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'checkout'
      AND indexname LIKE 'mercado_pago_payment%'
  LOOP
    target_name := replace(item.indexname, 'mercado_pago_payment', 'checkout');

    IF to_regclass('public.' || quote_ident(target_name)) IS NULL THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I', item.indexname, target_name);
    END IF;
  END LOOP;
END
$$;
