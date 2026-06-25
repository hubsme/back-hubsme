import { ApiProperty } from '@nestjs/swagger';

export class WhatsappSendResultDto {
  @ApiProperty({ example: 'Mensaje enviado exitosamente' })
  message: string;

  @ApiProperty({ example: '51929073820@s.whatsapp.net' })
  phone: string;

  @ApiProperty({ example: 201 })
  providerStatus: number;

  @ApiProperty({
    example: { success: true },
    nullable: true,
    required: false,
  })
  providerResponse?: Record<string, unknown> | string | null;
}
