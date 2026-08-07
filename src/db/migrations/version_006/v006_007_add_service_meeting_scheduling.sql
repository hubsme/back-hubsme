DO $$
BEGIN
  CREATE TYPE "meeting_type" AS ENUM ('consultoria', 'servicio');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "initial_meeting_proposed_start_times" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN IF NOT EXISTS "initial_meeting_start_time" timestamp;

ALTER TABLE "meeting"
  ADD COLUMN IF NOT EXISTS "service_request_id" integer REFERENCES "service_request"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "service_milestone_index" integer,
  ADD COLUMN IF NOT EXISTS "meeting_type" "meeting_type" DEFAULT 'consultoria' NOT NULL;

CREATE INDEX IF NOT EXISTS "meeting_service_request_id_idx"
  ON "meeting" ("service_request_id");

CREATE INDEX IF NOT EXISTS "meeting_service_milestone_idx"
  ON "meeting" ("service_request_id", "service_milestone_index");

CREATE UNIQUE INDEX IF NOT EXISTS "meeting_service_request_milestone_unique_active_idx"
  ON "meeting" ("service_request_id", COALESCE("service_milestone_index", -1))
  WHERE "deleted_at" IS NULL AND "meeting_type" = 'servicio' AND "service_request_id" IS NOT NULL;
