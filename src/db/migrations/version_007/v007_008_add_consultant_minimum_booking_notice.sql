ALTER TABLE "consultant"
ADD COLUMN IF NOT EXISTS "minimum_booking_notice_hours" integer DEFAULT 48;

UPDATE "consultant"
SET "minimum_booking_notice_hours" = 48
WHERE "minimum_booking_notice_hours" IS NULL;

ALTER TABLE "consultant"
ALTER COLUMN "minimum_booking_notice_hours" SET DEFAULT 48,
ALTER COLUMN "minimum_booking_notice_hours" SET NOT NULL;

ALTER TABLE "consultant"
DROP CONSTRAINT IF EXISTS "consultant_minimum_booking_notice_hours_check";

ALTER TABLE "consultant"
ADD CONSTRAINT "consultant_minimum_booking_notice_hours_check"
CHECK (
  "minimum_booking_notice_hours" BETWEEN 1 AND 720
);

COMMENT ON COLUMN "consultant"."minimum_booking_notice_hours" IS
'Horas mínimas de anticipación para reservar. El valor predeterminado es 48 horas.';
