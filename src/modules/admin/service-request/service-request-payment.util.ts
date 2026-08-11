import type { ServiceRequestPaymentPlan } from '@db/tables/service-request.table';

export function calculateServiceInstallmentAmounts(totalPrice: number, paymentPlan: ServiceRequestPaymentPlan) {
  const totalCents = Math.round(totalPrice * 100);
  if (!Number.isFinite(totalPrice) || totalCents <= 0 || !paymentPlan.installments.length) return [];

  let assignedCents = 0;
  return paymentPlan.installments.map((installment, installmentIndex) => {
    const isLast = installmentIndex === paymentPlan.installments.length - 1;
    const installmentCents = isLast
      ? totalCents - assignedCents
      : Math.round((totalCents * installment.percentage) / 100);
    assignedCents += installmentCents;
    return installmentCents / 100;
  });
}
