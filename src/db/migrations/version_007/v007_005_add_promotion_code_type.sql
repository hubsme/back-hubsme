DO $$
BEGIN
  CREATE TYPE "promotion_code_type" AS ENUM ('consultation', 'service');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "promotion_code"
  ADD COLUMN IF NOT EXISTS "type" "promotion_code_type" DEFAULT 'consultation' NOT NULL;

UPDATE "promotion_code"
SET "type" = 'consultation'
WHERE "type" IS NULL;

CREATE INDEX IF NOT EXISTS "promotion_code_type_idx"
  ON "promotion_code" ("type");
