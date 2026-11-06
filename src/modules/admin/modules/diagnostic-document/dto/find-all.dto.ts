import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { DiagnosticDocumentResultDto } from '@modules/admin/modules/diagnostic-document/dto/find-one.dto';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class DiagnosticDocumentListDto {
  @ApiProperty({ type: () => [DiagnosticDocumentResultDto] })
  data: DiagnosticDocumentResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
