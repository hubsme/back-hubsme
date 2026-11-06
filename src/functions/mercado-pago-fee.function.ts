import { TraceNode } from '@erixcel/traceflow';

export class MercadoPagoFeeFunction {
  @TraceNode({ name: 'mercado-pago-fee.asRecord', type: 'method' })
  static asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  }

  @TraceNode({ name: 'mercado-pago-fee.asFiniteNumber', type: 'method' })
  static asFiniteNumber(value: unknown): number | null {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  @TraceNode({ name: 'mercado-pago-fee.roundMoney', type: 'method' })
  static roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }

  @TraceNode({ name: 'mercado-pago-fee.getMercadoPagoSettlement', type: 'method' })
  static getMercadoPagoSettlement(
    rawPayment: Record<string, unknown> | null | undefined,
    grossAmount: number,
  ): {
    netReceivedAmount: number | null;
    feeAmount: number | null;
    feePercent: number | null;
  } {
    if (!Number.isFinite(grossAmount) || grossAmount <= 0 || !rawPayment) {
      return { netReceivedAmount: null, feeAmount: null, feePercent: null };
    }

    const transactionDetails = MercadoPagoFeeFunction.asRecord(rawPayment.transaction_details);
    const netReceivedAmount = MercadoPagoFeeFunction.asFiniteNumber(
      transactionDetails?.net_received_amount ?? rawPayment.net_received_amount,
    );

    const feeDetails = Array.isArray(rawPayment.fee_details) ? rawPayment.fee_details : [];
    const collectorFees = feeDetails
      .map((detail) => MercadoPagoFeeFunction.asRecord(detail))
      .filter((detail): detail is Record<string, unknown> => detail?.fee_payer === 'collector')
      .map((detail) => MercadoPagoFeeFunction.asFiniteNumber(detail.amount))
      .filter((amount): amount is number => amount !== null);
    const feeDetailsAmount = collectorFees.length
      ? MercadoPagoFeeFunction.roundMoney(collectorFees.reduce((total, amount) => total + amount, 0))
      : null;

    const feeAmount =
      netReceivedAmount !== null
        ? MercadoPagoFeeFunction.roundMoney(Math.max(grossAmount - netReceivedAmount, 0))
        : feeDetailsAmount;
    const resolvedNetReceivedAmount =
      netReceivedAmount !== null
        ? MercadoPagoFeeFunction.roundMoney(netReceivedAmount)
        : feeAmount !== null
          ? MercadoPagoFeeFunction.roundMoney(grossAmount - feeAmount)
          : null;
    const feePercent = feeAmount !== null ? Number(((feeAmount / grossAmount) * 100).toFixed(4)) : null;

    return {
      netReceivedAmount: resolvedNetReceivedAmount,
      feeAmount,
      feePercent,
    };
  }
}
