import type { CheckoutQuery } from '@queries/checkout/checkout.query';

export type CheckoutRow = NonNullable<Awaited<ReturnType<CheckoutQuery['findOne']>>>;

export type MonnetCheckoutPayment = {
  environment: 'cert' | 'production';
  merchantId: string;
  creationStatus: 'not_created' | 'creating' | 'ready' | 'uncertain' | 'failed';
  transactionId?: string;
  paymentUrl?: string;
  qrCode?: string;
  expiresAt?: string;
  stateId?: string;
};
