import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ConsultantGoogleCalendarBusyMonthDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  year: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

export class ConsultantGoogleCalendarBusyItemDto {
  @ApiProperty({ example: 'google-calendar-event-id' })
  id: string;

  @ApiProperty({ example: 'Reunion privada', nullable: true })
  summary: string | null;

  @ApiProperty({ example: '2026-06-11T14:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2026-06-11T15:00:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: 'google-calendar' })
  source: 'google-calendar';
}

export class ConsultantGoogleCalendarBusyMonthResponseDto {
  @ApiProperty({ type: [ConsultantGoogleCalendarBusyItemDto] })
  data: ConsultantGoogleCalendarBusyItemDto[];
}
