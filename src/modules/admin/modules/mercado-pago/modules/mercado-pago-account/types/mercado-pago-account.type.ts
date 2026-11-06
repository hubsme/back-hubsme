export type MercadoPagoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  message?: string;
  error_description?: string;
};

export type MercadoPagoUserResponse = {
  id?: number | string;
  nickname?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  site_id?: string;
  country_id?: string;
  user_type?: string;
  permalink?: string;
  registration_date?: string;
  date_created?: string;
  message?: string;
};

export type AccessTokenResult = {
  accessToken: string;
  tokenExpiresAt: Date | null;
};

export type MercadoPagoReportRecord = Record<string, unknown>;

export type MercadoPagoFinancialDownloadResult =
  | {
      kind: 'file';
      buffer: Buffer;
      contentType: string;
      fileName: string;
    }
  | {
      kind: 'processing';
      taskId: string | null;
      message: string;
    };
