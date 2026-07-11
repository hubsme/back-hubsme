DO $$
BEGIN
  CREATE TYPE "scheduled_notification_recipient" AS ENUM ('pyme', 'consultor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "scheduled_notification_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "scheduled_notification" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "meeting_id" integer NOT NULL REFERENCES "meeting"("id") ON DELETE CASCADE,
  "recipient" "scheduled_notification_recipient" NOT NULL,
  "status" "scheduled_notification_status" DEFAULT 'pending' NOT NULL,
  "scheduled_at" timestamp NOT NULL,
  "expires_at" timestamp NOT NULL,
  "payload" jsonb NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "locked_at" timestamp,
  "processed_at" timestamp,
  "last_error" text,
  CONSTRAINT "scheduled_notification_attempts_non_negative" CHECK ("attempts" >= 0),
  CONSTRAINT "scheduled_notification_max_attempts_positive" CHECK ("max_attempts" > 0)
);

CREATE INDEX IF NOT EXISTS "scheduled_notification_meeting_id_idx"
  ON "scheduled_notification" ("meeting_id");

CREATE INDEX IF NOT EXISTS "scheduled_notification_status_scheduled_at_idx"
  ON "scheduled_notification" ("status", "scheduled_at");

CREATE UNIQUE INDEX IF NOT EXISTS "scheduled_notification_meeting_recipient_pending_idx"
  ON "scheduled_notification" ("meeting_id", "recipient")
  WHERE "status" = 'pending';
