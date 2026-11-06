-- Aplicación manual antes de desplegar las definiciones Drizzle actualizadas.
-- DB_VERSION actual: version_012. Conserva los registros y los estados existentes.
BEGIN;

ALTER TABLE meeting_consultant_payout
  ADD COLUMN IF NOT EXISTS deleted_at timestamp;

ALTER TABLE scheduled_notification
  ADD COLUMN IF NOT EXISTS deleted_at timestamp;

COMMIT;
