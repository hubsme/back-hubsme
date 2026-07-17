import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class MeetingConfirmOptionDto {
  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  selectedStartTime: string;
}

export const meetingStatuses = [
  'solicitada',
  'pago_pendiente',
  'por_confirmar',
  'confirmada',
  'finalizada',
  'cancelada',
] as const;

export class MeetingStatusDto {
  @ApiProperty({ enum: meetingStatuses })
  @IsIn(meetingStatuses)
  status: (typeof meetingStatuses)[number];
}
