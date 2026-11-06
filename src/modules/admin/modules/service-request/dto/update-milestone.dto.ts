import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

@Trace({ type: 'validation' })
export class ServiceRequestMilestoneUpdateDto {
  @ApiProperty({ example: 'Validación final con contabilidad', maxLength: 160 })
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ example: '2026-09-20' })
  @IsDateString({ strict: true })
  dueDate: string;
}
