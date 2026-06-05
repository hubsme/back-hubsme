import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { DiagnosticDocumentResultDto } from './diagnostic-document-result.dto';

export class DiagnosticDocumentListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  diagnosticId?: number;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;

  @ApiPropertyOptional({ enum: ['informe', 'plan_accion', 'respuestas'] })
  @IsIn(['informe', 'plan_accion', 'respuestas'])
  @IsOptional()
  type?: 'informe' | 'plan_accion' | 'respuestas';
}

export class DiagnosticDocumentListDto {
  @ApiProperty({ type: [DiagnosticDocumentResultDto] })
  data: DiagnosticDocumentResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
