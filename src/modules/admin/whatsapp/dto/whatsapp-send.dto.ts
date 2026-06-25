import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
