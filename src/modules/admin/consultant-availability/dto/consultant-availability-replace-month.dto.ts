import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { ConsultantAvailabilityCreateDto } from './consultant-availability-create.dto';

export class ConsultantAvailabilityReplaceMonthDto {
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

  @ApiProperty({ type: [ConsultantAvailabilityCreateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultantAvailabilityCreateDto)
  slots: ConsultantAvailabilityCreateDto[];
}
