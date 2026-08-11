ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "payment_plan" jsonb DEFAULT '{
    "strategy": "single",
    "summary": "Pago único al aprobar la propuesta",
    "rationale": "El servicio se paga en una sola operación antes de iniciar.",
    "installments": [
      {
        "label": "Pago único del servicio",
        "percentage": 100,
        "trigger": "service_approval",
        "milestoneIndex": 0
      }
    ]
  }'::jsonb NOT NULL;

ALTER TABLE "checkout"
  ADD COLUMN IF NOT EXISTS "service_installment_index" integer;

UPDATE "checkout"
SET "service_installment_index" = 0
WHERE "service_request_id" IS NOT NULL
  AND "service_installment_index" IS NULL;

DROP INDEX IF EXISTS "checkout_service_request_unique_active_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "checkout_service_request_installment_unique_active_idx"
  ON "checkout" ("service_request_id", "service_installment_index")
  WHERE "deleted_at" IS NULL AND "service_request_id" IS NOT NULL;

ALTER TABLE "checkout"
  DROP CONSTRAINT IF EXISTS "checkout_service_installment_presence_check";

ALTER TABLE "checkout"
  ADD CONSTRAINT "checkout_service_installment_presence_check" CHECK (
    ("service_request_id" IS NULL AND "service_installment_index" IS NULL)
    OR
    ("service_request_id" IS NOT NULL AND "service_installment_index" IS NOT NULL)
  );
