ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "evidence_attachments" jsonb DEFAULT '[]'::jsonb NOT NULL;
