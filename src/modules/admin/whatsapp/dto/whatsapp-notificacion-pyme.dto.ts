import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappNotificacionPymeDto {
  @ApiProperty({
    example: '51929073820',
    description: 'Número de WhatsApp del destinatario (sin @s.whatsapp.net)',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Erick', description: 'Nombre de la PYME' })
  @IsString()
  @IsNotEmpty()
  nombre_pyme: string;

  @ApiProperty({ example: 'Miguel Salinas', description: 'Nombre del consultor' })
  @IsString()
  @IsNotEmpty()
  nombre_consultor: string;

  @ApiProperty({ example: 'Sesión con Miguel Salinas', description: 'Título de la sesión' })
  @IsString()
  @IsNotEmpty()
  titulo_sesion: string;

  @ApiProperty({ example: '26/06/2026, 12:00 pm', description: 'Fecha y hora de la sesión' })
  @IsString()
  @IsNotEmpty()
  fecha_hora: string;

  @ApiProperty({ example: '60 minutos', description: 'Duración de la sesión' })
  @IsString()
  @IsNotEmpty()
  duracion: string;
}
