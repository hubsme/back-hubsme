import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class ConsultantAvailabilityCreateDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: '2026-06-15T14:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty({ example: '2026-06-15T16:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiPropertyOptional({ enum: ['disponible', 'bloqueado'], default: 'disponible' })
  @IsIn(['disponible', 'bloqueado'])
  @IsOptional()
  status?: 'disponible' | 'bloqueado';

  @ApiPropertyOptional({ example: 'Horario disponible para consultoria estrategica.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
