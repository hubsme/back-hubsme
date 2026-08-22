import { CheckoutRaw } from '@db/tables/checkout.table';

export type MercadoPagoSettlement = {
  netReceivedAmount: number | null;
  feeAmount: number | null;
  feePercent: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asFiniteNumber(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

/**
 * Obtiene el impacto real de Mercado Pago a partir de la respuesta del pago.
 * El neto de Mercado Pago es la fuente de verdad; fee_details queda como
 * fallback para pagos que no incluyan transaction_details.net_received_amount.
 */
export function getMercadoPagoSettlement(
  rawPayment: CheckoutRaw | null | undefined,
  grossAmount: number,
): MercadoPagoSettlement {
  if (!Number.isFinite(grossAmount) || grossAmount <= 0 || !rawPayment) {
    return { netReceivedAmount: null, feeAmount: null, feePercent: null };
  }

  const transactionDetails = asRecord(rawPayment.transaction_details);
  const netReceivedAmount = asFiniteNumber(transactionDetails?.net_received_amount ?? rawPayment.net_received_amount);

  const feeDetails = Array.isArray(rawPayment.fee_details) ? rawPayment.fee_details : [];
  const collectorFees = feeDetails
    .map((detail) => asRecord(detail))
    .filter((detail): detail is Record<string, unknown> => detail?.fee_payer === 'collector')
    .map((detail) => asFiniteNumber(detail.amount))
    .filter((amount): amount is number => amount !== null);
  const feeDetailsAmount = collectorFees.length
    ? roundMoney(collectorFees.reduce((total, amount) => total + amount, 0))
    : null;

  const feeAmount =
    netReceivedAmount !== null ? roundMoney(Math.max(grossAmount - netReceivedAmount, 0)) : feeDetailsAmount;
  const resolvedNetReceivedAmount =
    netReceivedAmount !== null
      ? roundMoney(netReceivedAmount)
      : feeAmount !== null
        ? roundMoney(grossAmount - feeAmount)
        : null;
  const feePercent = feeAmount !== null ? Number(((feeAmount / grossAmount) * 100).toFixed(4)) : null;

  return {
    netReceivedAmount: resolvedNetReceivedAmount,
    feeAmount,
    feePercent,
  };
}
