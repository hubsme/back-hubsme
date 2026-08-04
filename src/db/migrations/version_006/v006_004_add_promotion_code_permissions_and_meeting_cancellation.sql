ALTER TABLE "promotion_code"
  ADD COLUMN IF NOT EXISTS "allowed_pyme_ids" integer[],
  ADD COLUMN IF NOT EXISTS "allowed_consultant_ids" integer[];

ALTER TABLE "meeting"
  ADD COLUMN IF NOT EXISTS "cancellation_reason" text;
