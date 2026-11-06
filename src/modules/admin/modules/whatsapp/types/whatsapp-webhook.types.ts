import { Request } from 'express';

export type WhatsappWebhookRequest = Request & {
  rawBody?: Buffer;
};

export type WhatsappWebhookMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: {
    body?: string;
  };
  button?: {
    text?: string;
    payload?: string;
  };
  interactive?: {
    type?: string;
    button_reply?: {
      id?: string;
      title?: string;
    };
  };
};

export type WhatsappWebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messages?: WhatsappWebhookMessage[];
      };
    }>;
  }>;
};
