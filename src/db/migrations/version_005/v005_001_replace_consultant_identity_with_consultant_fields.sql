DROP TABLE IF EXISTS "consultant_identity";

ALTER TABLE "consultant"
  ADD COLUMN IF NOT EXISTS "dni" varchar(8),
  ADD COLUMN IF NOT EXISTS "birth_date" date;

CREATE INDEX IF NOT EXISTS "consultant_dni_idx"
  ON "consultant" ("dni");
