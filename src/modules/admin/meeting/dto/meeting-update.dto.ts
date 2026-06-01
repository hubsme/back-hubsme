import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class MeetingUpdateDto {
  @ApiPropertyOptional({ example: 'Sesion de diagnostico empresarial' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: '2026-05-10T15:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Revisar objetivos, contexto y dudas principales para la sesion.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['solicitada', 'confirmada', 'finalizada', 'cancelada'] })
  @IsIn(['solicitada', 'confirmada', 'finalizada', 'cancelada'])
  @IsOptional()
  status?: 'solicitada' | 'confirmada' | 'finalizada' | 'cancelada';
}
