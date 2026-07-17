import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class MeetingCreateDto {
  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 'Sesion de diagnostico empresarial' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: '2026-05-10T15:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTime?: Date;

  @ApiPropertyOptional({
    type: [String],
    example: ['2026-05-10T15:00:00.000Z', '2026-05-10T16:00:00.000Z', '2026-05-11T15:00:00.000Z'],
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  @IsOptional()
  proposedStartTimes?: string[];

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

  @ApiPropertyOptional({ enum: ['pyme', 'consultor'], default: 'pyme' })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  requestedBy?: 'pyme' | 'consultor';
}
