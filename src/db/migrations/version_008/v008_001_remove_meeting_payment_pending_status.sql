UPDATE "meeting"
SET "status" = 'solicitada'
WHERE "status" = 'pago_pendiente';

ALTER TABLE "meeting"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TYPE "meeting_status"
  RENAME TO "meeting_status_legacy";

CREATE TYPE "meeting_status" AS ENUM (
  'solicitada',
  'por_confirmar',
  'confirmada',
  'finalizada',
  'cancelada'
);

ALTER TABLE "meeting"
  ALTER COLUMN "status" TYPE "meeting_status"
  USING "status"::text::"meeting_status";

ALTER TABLE "meeting"
  ALTER COLUMN "status" SET DEFAULT 'solicitada';

DROP TYPE "meeting_status_legacy";
