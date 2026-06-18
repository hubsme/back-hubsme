import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { ConsultantAvailabilityResultDto } from './consultant-availability-result.dto';

export class ConsultantAvailabilityListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startFrom?: Date;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTo?: Date;
}

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

export class ConsultantAvailabilityListDto {
  @ApiProperty({ type: [ConsultantAvailabilityResultDto] })
  data: ConsultantAvailabilityResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ConsultantAvailabilityMonthDto {
  @ApiProperty({ type: [ConsultantAvailabilityResultDto] })
  data: ConsultantAvailabilityResultDto[];
}
