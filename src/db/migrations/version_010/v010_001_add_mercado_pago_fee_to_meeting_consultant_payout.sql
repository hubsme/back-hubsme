ALTER TABLE "meeting_consultant_payout"
  ADD COLUMN IF NOT EXISTS "mercado_pago_fee_amount" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "mercado_pago_fee_percent" numeric(7, 4);

COMMENT ON COLUMN "meeting_consultant_payout"."mercado_pago_fee_amount" IS
  'Cargo real retenido por Mercado Pago, incluido IGV y otros cargos informados por el proveedor';

COMMENT ON COLUMN "meeting_consultant_payout"."mercado_pago_fee_percent" IS
  'Porcentaje efectivo del cargo de Mercado Pago sobre el monto bruto cobrado';

-- Backfill idempotente usando el neto real que Mercado Pago devolvió en raw_payment.
-- Solo se modifica amount para obligaciones pendientes; los depósitos ya pagados
-- conservan el importe histórico que fue transferido al consultor.
WITH settlement AS (
  SELECT
    payout.id,
    checkout.amount::numeric AS gross_amount,
    checkout.marketplace_fee::numeric AS platform_commission_amount,
    NULLIF(checkout.raw_payment #>> '{transaction_details,net_received_amount}', '')::numeric AS net_received_amount,
    COALESCE((
      SELECT SUM(NULLIF(detail->>'amount', '')::numeric)
      FROM jsonb_array_elements(COALESCE(checkout.raw_payment->'fee_details', '[]'::jsonb)) AS detail
      WHERE detail->>'fee_payer' = 'collector'
    ), 0)::numeric AS fee_details_amount
  FROM "meeting_consultant_payout" payout
  JOIN "checkout" checkout ON checkout.id = payout.checkout_id
), normalized AS (
  SELECT
    id,
    gross_amount,
    platform_commission_amount,
    COALESCE(net_received_amount, gross_amount - fee_details_amount) AS net_received_amount,
    CASE
      WHEN net_received_amount IS NOT NULL THEN gross_amount - net_received_amount
      WHEN fee_details_amount > 0 THEN fee_details_amount
      ELSE NULL
    END AS fee_amount
  FROM settlement
)
UPDATE "meeting_consultant_payout" payout
SET
  "mercado_pago_fee_amount" = ROUND(GREATEST(normalized.fee_amount, 0), 2),
  "mercado_pago_fee_percent" = ROUND(
    GREATEST(normalized.fee_amount, 0) / NULLIF(normalized.gross_amount, 0) * 100,
    4
  ),
  "amount" = CASE
    WHEN payout.status = 'pending'
      AND normalized.net_received_amount > normalized.platform_commission_amount
      THEN ROUND(normalized.net_received_amount - normalized.platform_commission_amount, 2)
    ELSE payout.amount
  END,
  "updated_at" = now()
FROM normalized
WHERE payout.id = normalized.id
  AND normalized.fee_amount IS NOT NULL;
