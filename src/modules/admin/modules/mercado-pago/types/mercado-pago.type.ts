export type MercadoPagoState = {
  flow: 'consultant-mercado-pago';
  consultantId: number;
};

export type MeetingDetails = {
  startTime: string;
  proposedStartTimes?: string[];
  durationMinutes: number;
  title: string;
  description?: string;
};

export type MercadoPagoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number | string;
  error?: string;
  message?: string;
  error_description?: string;
};

export type MercadoPagoUserResponse = {
  id?: number | string;
  nickname?: string;
  email?: string;
  message?: string;
};

export type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
};

export type MercadoPagoPaymentResponse = Record<string, unknown> & {
  id?: number | string;
  status?: string;
  external_reference?: string;
  message?: string;
};

export type MercadoPagoPaymentSearchResponse = {
  results?: MercadoPagoPaymentResponse[];
  message?: string;
  error?: string;
};
