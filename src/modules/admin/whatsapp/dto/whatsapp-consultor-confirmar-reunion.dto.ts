import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class WhatsappConsultorConfirmarReunionDto {
  @ApiProperty({ example: '+51999999999' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 42, description: 'ID interno usado en el payload de los botones' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reunion_id: number;

  @ApiProperty({ example: 'Miguel Salinas' })
  @IsString()
  @IsNotEmpty()
  nombre_consultor: string;

  @ApiProperty({ example: 'CyM Ingenieros SAC' })
  @IsString()
  @IsNotEmpty()
  nombre_pyme: string;

  @ApiProperty({ example: 'Sesión de transformación digital' })
  @IsString()
  @IsNotEmpty()
  tema_reunion: string;

  @ApiProperty({ example: '60 minutos' })
  @IsString()
  @IsNotEmpty()
  duracion_reunion: string;

  @ApiProperty({ example: '15 de jul., 6:00 p. m.' })
  @IsString()
  @IsNotEmpty()
  horario_opcion_a: string;

  @ApiProperty({ example: '16 de jul., 2:00 p. m.' })
  @IsString()
  @IsNotEmpty()
  horario_opcion_b: string;

  @ApiProperty({ example: '17 de jul., 8:00 p. m.' })
  @IsString()
  @IsNotEmpty()
  horario_opcion_c: string;
}
