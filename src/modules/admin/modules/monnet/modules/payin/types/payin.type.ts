export type PayinFlow = 'bank-transfer' | 'qr' | 'yape-mobile' | 'yape-web';

export type PayinOperation = {
  payinStateID: string;
  payinAmount: string;
  payinCurrency: string;
  payinMerchantOperationNumber: string;
  payinID?: string;
};

export type PayinPayload = Record<string, string | number>;

export type PayinConfiguration = {
  environment: 'cert' | 'production';
  baseUrl: string;
  merchantId: string;
  key: string;
  successUrl: string;
  errorUrl: string;
  currency: 'PEN' | 'USD';
  expirationMinutes: number;
  timeoutMs: number;
  urlMonnet: string;
};
