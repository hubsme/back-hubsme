import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiPropertyOptional({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'https://meet.google.com/demo' })
  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @ApiPropertyOptional({ enum: ['solicitada', 'confirmada', 'finalizada', 'cancelada'], default: 'confirmada' })
  @IsIn(['solicitada', 'confirmada', 'finalizada', 'cancelada'])
  @IsOptional()
  status?: 'solicitada' | 'confirmada' | 'finalizada' | 'cancelada';
}
