import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class WhatsappSendDto {
  @ApiProperty({
    example: '51929073820',
    description: 'Numero de WhatsApp del destinatario. Puede enviarse con o sin @s.whatsapp.net',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: 'Mensaje que se enviara por WhatsApp' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
