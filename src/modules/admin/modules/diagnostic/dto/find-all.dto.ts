import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { DiagnosticResultDto } from '@modules/admin/modules/diagnostic/dto/find-one.dto';

@Trace({ type: 'validation' })
export class DiagnosticListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;
}

@Trace({ type: 'validation' })
export class DiagnosticListDto {
  @ApiProperty({ type: () => [DiagnosticResultDto] })
  data: DiagnosticResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
