import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

@Trace({ type: 'validation' })
export class ConsultantGoogleCalendarAuthUrlDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;
}

@Trace({ type: 'validation' })
export class ConsultantGoogleCalendarAuthUrlResponseDto {
  @ApiProperty({ example: 'https://accounts.google.com/o/oauth2/v2/auth?...' })
  url: string;
}

@Trace({ type: 'validation' })
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
