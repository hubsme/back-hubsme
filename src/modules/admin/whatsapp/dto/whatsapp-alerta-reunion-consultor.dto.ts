import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappAlertaReunionConsultorDto {
  @ApiProperty({
    example: '51929073820',
    description: 'Número de WhatsApp del destinatario (sin @s.whatsapp.net)',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: '15 min', description: 'Tiempo restante para el inicio de la reunión' })
  @IsString()
  @IsNotEmpty()
  tiempo_restante: string;

  @ApiProperty({ example: 'Miguel Salinas', description: 'Nombre del consultor' })
  @IsString()
  @IsNotEmpty()
  nombre_consultor: string;

  @ApiProperty({ example: 'CyM Ingenieros SAC', description: 'Nombre de la PYME' })
  @IsString()
  @IsNotEmpty()
  nombre_pyme: string;

  @ApiProperty({ example: 'Sesión con Miguel Salinas', description: 'Título de la sesión' })
  @IsString()
  @IsNotEmpty()
  titulo_sesion: string;

  @ApiProperty({ example: '09/09/2026', description: 'Fecha y hora de la sesión' })
  @IsString()
  @IsNotEmpty()
  fecha_hora: string;

  @ApiProperty({ example: '60 minutos', description: 'Duración de la reunión' })
  @IsString()
  @IsNotEmpty()
  tiempo: string;

  @ApiProperty({
    example: 'https://teams.microsoft.com/l/meetup-join/example',
    description: 'Enlace de la reunión',
  })
  @IsString()
  @IsNotEmpty()
  enlace: string;
}
