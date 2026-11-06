import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class EmailSendResultDto {
  @ApiProperty({ example: 'Correo enviado exitosamente' })
  message: string;

  @ApiProperty({ example: '<abc123@mail.gmail.com>' })
  messageId: string;
}

@Trace({ type: 'validation' })
export class EmailSendDto {
  @ApiProperty({ example: 'cliente@hubsme.net', description: 'Correo del destinatario' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Bienvenido a Hubsme', description: 'Asunto del correo' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Contenido del correo en texto plano', description: 'Mensaje en texto plano' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    example: '<p>Contenido del correo en HTML</p>',
    description: 'Mensaje en formato HTML',
    required: false,
  })
  @IsString()
  @IsOptional()
  html?: string;
}
