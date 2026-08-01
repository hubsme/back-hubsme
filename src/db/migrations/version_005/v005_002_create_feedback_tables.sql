DO $$
BEGIN
  CREATE TYPE "feedback_status" AS ENUM (
    'new',
    'in_review',
    'accepted',
    'resolved',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "feedback_reply_author_type" AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "feedback" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "user_id" integer NOT NULL REFERENCES "app_user"("id"),
  "user_role" "user_role" NOT NULL,
  "title" varchar(160) NOT NULL,
  "description" text NOT NULL,
  "status" "feedback_status" DEFAULT 'new' NOT NULL,
  "status_updated_at" timestamp,
  "status_updated_by" varchar(120),
  CONSTRAINT "feedback_user_role_check" CHECK ("user_role" IN ('pyme', 'consultor'))
);

CREATE TABLE IF NOT EXISTS "feedback_attachment" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "feedback_id" integer NOT NULL REFERENCES "feedback"("id") ON DELETE CASCADE,
  "storage_path" text NOT NULL,
  "file_url" text NOT NULL,
  "original_name" varchar(255) NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "size_bytes" integer NOT NULL,
  CONSTRAINT "feedback_attachment_size_positive" CHECK ("size_bytes" > 0)
);

CREATE TABLE IF NOT EXISTS "feedback_reply" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "feedback_id" integer NOT NULL REFERENCES "feedback"("id") ON DELETE CASCADE,
  "author_type" "feedback_reply_author_type" NOT NULL,
  "author_user_id" integer REFERENCES "app_user"("id"),
  "author_name" varchar(200) NOT NULL,
  "message" text NOT NULL,
  CONSTRAINT "feedback_reply_author_check" CHECK (
    ("author_type" = 'user' AND "author_user_id" IS NOT NULL)
    OR ("author_type" = 'admin' AND "author_user_id" IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS "feedback_user_id_idx"
  ON "feedback" ("user_id");

CREATE INDEX IF NOT EXISTS "feedback_status_idx"
  ON "feedback" ("status");

CREATE INDEX IF NOT EXISTS "feedback_created_at_idx"
  ON "feedback" ("created_at");

CREATE INDEX IF NOT EXISTS "feedback_updated_at_idx"
  ON "feedback" ("updated_at");

CREATE INDEX IF NOT EXISTS "feedback_title_idx"
  ON "feedback" USING gin ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "feedback_description_idx"
  ON "feedback" USING gin ("description" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "feedback_attachment_feedback_id_idx"
  ON "feedback_attachment" ("feedback_id");

CREATE INDEX IF NOT EXISTS "feedback_attachment_created_at_idx"
  ON "feedback_attachment" ("created_at");

CREATE INDEX IF NOT EXISTS "feedback_reply_feedback_id_idx"
  ON "feedback_reply" ("feedback_id");

CREATE INDEX IF NOT EXISTS "feedback_reply_author_user_id_idx"
  ON "feedback_reply" ("author_user_id");

CREATE INDEX IF NOT EXISTS "feedback_reply_created_at_idx"
  ON "feedback_reply" ("created_at");
