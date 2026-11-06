import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class MeetingConfirmOptionDto {
  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  selectedStartTime: string;
}
