import { ApiProperty } from '@nestjs/swagger';

export class EmailSendResultDto {
  @ApiProperty({ example: 'Correo enviado exitosamente' })
  message: string;

  @ApiProperty({ example: '<abc123@mail.gmail.com>' })
  messageId: string;
}
