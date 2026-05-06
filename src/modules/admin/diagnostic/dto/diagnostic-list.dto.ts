import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { DiagnosticResultDto } from './diagnostic-result.dto';

export class DiagnosticListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;
}

export class DiagnosticListDto {
  @ApiProperty({ type: [DiagnosticResultDto] })
  data: DiagnosticResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
