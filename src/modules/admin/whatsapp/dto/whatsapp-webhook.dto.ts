import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import type { WhatsappWebhookPayload } from '../types/whatsapp-webhook.types';

export class WhatsappWebhookPayloadDto implements WhatsappWebhookPayload {
  @Allow()
  @ApiPropertyOptional({ example: 'whatsapp_business_account' })
  object?: string;

  @Allow()
  @ApiPropertyOptional({
    type: [Object],
    example: [
      {
        changes: [
          {
            field: 'messages',
            value: {
              messages: [
                {
                  from: '51999999999',
                  type: 'button',
                  button: {
                    text: 'Horario A',
                    payload: 'meeting:42:option:a',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  })
  entry?: WhatsappWebhookPayload['entry'];
}

export class WhatsappWebhookAcceptedDto {
  @ApiProperty({ example: true })
  received: boolean;
}
