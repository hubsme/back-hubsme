import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

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
