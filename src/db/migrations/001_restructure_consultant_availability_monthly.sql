BEGIN;

CREATE TEMP TABLE consultant_availability_monthly_tmp AS
WITH expanded_slots AS (
  SELECT
    consultant_id,
    date_trunc('month', slot_start AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::date AS month,
    extract(day FROM slot_start AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::int::text AS day_key,
    to_char(slot_start AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima', 'HH24:MI') AS time_value,
    min(created_at) AS created_at,
    max(updated_at) AS updated_at
  FROM consultant_availability
  CROSS JOIN LATERAL generate_series(
    start_time,
    end_time - interval '30 minutes',
    interval '30 minutes'
  ) AS slot_start
  WHERE deleted_at IS NULL
    AND status::text = 'disponible'
  GROUP BY
    consultant_id,
    date_trunc('month', slot_start AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::date,
    extract(day FROM slot_start AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')::int::text,
    slot_start
),
day_schedules AS (
  SELECT
    consultant_id,
    month,
    day_key,
    jsonb_agg(time_value ORDER BY time_value) AS times,
    min(created_at) AS created_at,
    max(updated_at) AS updated_at
  FROM expanded_slots
  GROUP BY consultant_id, month, day_key
)
SELECT
  consultant_id,
  month,
  jsonb_object_agg(day_key, times ORDER BY day_key::int) AS available_schedule,
  min(created_at) AS created_at,
  max(updated_at) AS updated_at
FROM day_schedules
GROUP BY consultant_id, month;

DROP INDEX IF EXISTS consultant_availability_slot_unique_active_idx;
DROP INDEX IF EXISTS consultant_availability_start_time_idx;
DROP INDEX IF EXISTS consultant_availability_end_time_idx;
DROP INDEX IF EXISTS consultant_availability_status_idx;

TRUNCATE TABLE consultant_availability RESTART IDENTITY;

ALTER TABLE consultant_availability
  DROP COLUMN IF EXISTS start_time,
  DROP COLUMN IF EXISTS end_time,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS notes,
  ADD COLUMN IF NOT EXISTS month date,
  ADD COLUMN IF NOT EXISTS available_schedule jsonb NOT NULL DEFAULT '{}'::jsonb;

INSERT INTO consultant_availability (
  created_at,
  updated_at,
  consultant_id,
  month,
  available_schedule
)
SELECT
  created_at,
  updated_at,
  consultant_id,
  month,
  available_schedule
FROM consultant_availability_monthly_tmp;

ALTER TABLE consultant_availability
  ALTER COLUMN month SET NOT NULL;

CREATE INDEX IF NOT EXISTS consultant_availability_month_idx
  ON consultant_availability (month);

CREATE UNIQUE INDEX IF NOT EXISTS consultant_availability_month_unique_active_idx
  ON consultant_availability (consultant_id, month)
  WHERE deleted_at IS NULL;

DROP TYPE IF EXISTS consultant_availability_status;

COMMIT;
