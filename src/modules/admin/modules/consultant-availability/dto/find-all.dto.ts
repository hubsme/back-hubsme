import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { ConsultantAvailabilityResultDto } from '@modules/admin/modules/consultant-availability/dto/find-one.dto';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class ConsultantAvailabilityListDto {
  @ApiProperty({ type: () => [ConsultantAvailabilityResultDto] })
  data: ConsultantAvailabilityResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
