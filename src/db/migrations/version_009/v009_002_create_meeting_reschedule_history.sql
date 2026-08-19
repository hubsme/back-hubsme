CREATE TABLE IF NOT EXISTS "meeting_reschedule_history" (
  "id" serial PRIMARY KEY,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp,
  "root_meeting_id" integer NOT NULL,
  "source_meeting_id" integer NOT NULL,
  "replacement_meeting_id" integer,
  "promotion_code_id" integer NOT NULL,
  "promotion_code_redemption_id" integer,
  "cancellation_reason" text,
  "cancelled_by" integer,
  CONSTRAINT "meeting_reschedule_history_root_meeting_fk"
    FOREIGN KEY ("root_meeting_id") REFERENCES "meeting"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_reschedule_history_source_meeting_fk"
    FOREIGN KEY ("source_meeting_id") REFERENCES "meeting"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_reschedule_history_replacement_meeting_fk"
    FOREIGN KEY ("replacement_meeting_id") REFERENCES "meeting"("id") ON DELETE SET NULL,
  CONSTRAINT "meeting_reschedule_history_promotion_code_fk"
    FOREIGN KEY ("promotion_code_id") REFERENCES "promotion_code"("id") ON DELETE RESTRICT,
  CONSTRAINT "meeting_reschedule_history_redemption_fk"
    FOREIGN KEY ("promotion_code_redemption_id") REFERENCES "promotion_code_redemption"("id") ON DELETE SET NULL,
  CONSTRAINT "meeting_reschedule_history_cancelled_by_fk"
    FOREIGN KEY ("cancelled_by") REFERENCES "app_user"("id") ON DELETE SET NULL
);

COMMENT ON TABLE "meeting_reschedule_history" IS
  'Historial y trazabilidad de reuniones canceladas y sustituidas mediante cupones automáticos';

COMMENT ON COLUMN "meeting_reschedule_history"."root_meeting_id" IS
  'Reunión raíz original donde se originó el cobro o agendamiento inicial';

COMMENT ON COLUMN "meeting_reschedule_history"."source_meeting_id" IS
  'Reunión que fue cancelada en este paso';

COMMENT ON COLUMN "meeting_reschedule_history"."replacement_meeting_id" IS
  'Nueva reunión agendada al canjear el cupón de reposición';

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_root_meeting_idx"
  ON "meeting_reschedule_history" ("root_meeting_id");

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_source_meeting_idx"
  ON "meeting_reschedule_history" ("source_meeting_id");

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_replacement_meeting_idx"
  ON "meeting_reschedule_history" ("replacement_meeting_id");

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_promotion_code_idx"
  ON "meeting_reschedule_history" ("promotion_code_id");

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_redemption_idx"
  ON "meeting_reschedule_history" ("promotion_code_redemption_id");

CREATE INDEX IF NOT EXISTS "meeting_reschedule_history_created_at_idx"
  ON "meeting_reschedule_history" ("created_at");

-- Backfill idempotente para registros históricos existentes basados en la descripción del cupón
INSERT INTO "meeting_reschedule_history" (
  "root_meeting_id",
  "source_meeting_id",
  "replacement_meeting_id",
  "promotion_code_id",
  "promotion_code_redemption_id",
  "cancellation_reason",
  "cancelled_by",
  "created_at",
  "updated_at"
)
SELECT
  source_meeting.id AS "root_meeting_id",
  source_meeting.id AS "source_meeting_id",
  pcr.meeting_id AS "replacement_meeting_id",
  pc.id AS "promotion_code_id",
  pcr.id AS "promotion_code_redemption_id",
  COALESCE(source_meeting.cancellation_reason, 'Cancelación de reunión por consultor') AS "cancellation_reason",
  source_meeting.consultant_id AS "cancelled_by",
  pc.created_at AS "created_at",
  COALESCE(pcr.created_at, pc.updated_at, pc.created_at) AS "updated_at"
FROM "promotion_code" pc
JOIN "meeting" source_meeting
  ON source_meeting.id = (SUBSTRING(pc.description FROM '#([0-9]+)'))::integer
LEFT JOIN "promotion_code_redemption" pcr
  ON pcr.promotion_code_id = pc.id AND pcr.deleted_at IS NULL
WHERE pc.description LIKE 'Reposición automática por cancelación de la reunión #%'
  AND NOT EXISTS (
    SELECT 1 FROM "meeting_reschedule_history" mrh
    WHERE mrh.promotion_code_id = pc.id
  );

-- Ajuste de root_meeting_id para cadenas de más de un reagendamiento previo
WITH RECURSIVE meeting_chain AS (
  SELECT
    mrh.id AS history_id,
    mrh.source_meeting_id,
    mrh.source_meeting_id AS computed_root_id
  FROM "meeting_reschedule_history" mrh
  WHERE NOT EXISTS (
    SELECT 1
    FROM "meeting_reschedule_history" parent
    WHERE parent.replacement_meeting_id = mrh.source_meeting_id
  )
  UNION ALL
  SELECT
    child.id AS history_id,
    child.source_meeting_id,
    parent_chain.computed_root_id
  FROM "meeting_reschedule_history" child
  JOIN meeting_chain parent_chain
    ON parent_chain.history_id IN (
      SELECT p.id FROM "meeting_reschedule_history" p WHERE p.replacement_meeting_id = child.source_meeting_id
    )
)
UPDATE "meeting_reschedule_history" target
SET "root_meeting_id" = mc.computed_root_id
FROM meeting_chain mc
WHERE target.id = mc.history_id
  AND target.root_meeting_id <> mc.computed_root_id;
