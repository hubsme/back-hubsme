DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'meeting_status'
      AND e.enumlabel = 'por_confirmar'
  ) THEN
    ALTER TYPE meeting_status ADD VALUE 'por_confirmar' AFTER 'pago_pendiente';
  END IF;
END $$;

ALTER TABLE meeting
  ADD COLUMN IF NOT EXISTS proposed_start_times text[] NOT NULL DEFAULT ARRAY[]::text[];

UPDATE meeting
SET proposed_start_times = ARRAY[start_time::text]
WHERE cardinality(proposed_start_times) = 0
  AND start_time IS NOT NULL;

ALTER TABLE meeting
  ALTER COLUMN start_time DROP NOT NULL;
