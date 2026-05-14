import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PymeConsultantMatchCreateDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'], default: 'pendiente' })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiPropertyOptional({ example: 'diagnostico' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'Match generado por afinidad de sector y especialidad.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
