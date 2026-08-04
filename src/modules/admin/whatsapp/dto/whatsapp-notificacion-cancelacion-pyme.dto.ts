import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WhatsappNotificacionCancelacionPymeDto {
  @ApiProperty({ example: '51929073820' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'CyM Ingenieros SAC' })
  @IsString()
  @IsNotEmpty()
  nombre_pyme: string;

  @ApiProperty({ example: 'Sesión con Miguel Salinas' })
  @IsString()
  @IsNotEmpty()
  tema_reunion: string;

  @ApiProperty({ example: 'Miguel Salinas' })
  @IsString()
  @IsNotEmpty()
  nombre_consultor: string;

  @ApiProperty({ example: '15 de jul., 6:00 p. m.' })
  @IsString()
  @IsNotEmpty()
  fecha_hora: string;

  @ApiProperty({ example: '60 min.' })
  @IsString()
  @IsNotEmpty()
  duracion_reunion: string;

  @ApiProperty({ example: 'El consultor presentó un inconveniente personal.' })
  @IsString()
  @IsNotEmpty()
  motivo_cancelacion: string;

  @ApiProperty({ example: 'REUNION-FREE-A1B2C3D4E5F6' })
  @IsString()
  @IsNotEmpty()
  codigo_cupon: string;
}
