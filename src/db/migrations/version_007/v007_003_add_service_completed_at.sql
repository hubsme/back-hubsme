ALTER TABLE "service_request"
  ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

ALTER TABLE "service_request"
  DROP CONSTRAINT IF EXISTS "service_request_proposal_price_check";

ALTER TABLE "service_request"
  ADD CONSTRAINT "service_request_proposal_price_check" CHECK (
    "status" NOT IN ('proposal_sent', 'payment_pending', 'paid', 'completed')
    OR "proposed_price" IS NOT NULL
  );
