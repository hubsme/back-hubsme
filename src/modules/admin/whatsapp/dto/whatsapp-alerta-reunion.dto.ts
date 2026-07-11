import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappAlertaReunionDto {
  @ApiProperty({
    example: '51929073820',
    description: 'Número de WhatsApp del destinatario (sin @s.whatsapp.net)',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: '30 min', description: 'Tiempo para el encabezado (header)' })
  @IsString()
  @IsNotEmpty()
  tiempo_header: string;

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

  @ApiProperty({ example: '09/09/2026', description: 'Fecha y hora de la sesión' })
  @IsString()
  @IsNotEmpty()
  fecha_hora: string;

  @ApiProperty({ example: '60 minutos', description: 'Tiempo para el cuerpo (body)' })
  @IsString()
  @IsNotEmpty()
  tiempo_body: string;

  @ApiProperty({
    example: 'https://teams.microsoft.com/l/meetup-join/example',
    description: 'Enlace de la reunión',
  })
  @IsString()
  @IsNotEmpty()
  enlace: string;
}
