import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { ConsultantAvailabilityResultDto } from '@modules/admin/modules/consultant-availability/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ConsultantAvailabilityMonthFiltersDto {
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

@Trace({ type: 'validation' })
export class ConsultantAvailabilityMonthDto {
  @ApiProperty({ type: () => [ConsultantAvailabilityResultDto] })
  data: ConsultantAvailabilityResultDto[];
}
