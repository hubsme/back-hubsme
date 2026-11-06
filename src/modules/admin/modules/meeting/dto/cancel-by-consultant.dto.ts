import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';

@Trace({ type: 'validation' })
export class MeetingConsultantCancelDto {
  @ApiProperty({
    example: 'Se presentó un inconveniente personal y no podré asistir.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

@Trace({ type: 'validation' })
export class MeetingConsultantCancelResultDto {
  @ApiProperty({ type: () => MeetingResultDto })
  meeting: MeetingResultDto;

  @ApiProperty({ example: 'REUNION-FREE-A1B2C3D4E5F6' })
  promotionCode: string;
}
