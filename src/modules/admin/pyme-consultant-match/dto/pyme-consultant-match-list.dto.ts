import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { PymeConsultantMatchResultDto } from './pyme-consultant-match-result.dto';

export class PymeConsultantMatchListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by PYME or consultant name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';
}

export class PymeConsultantMatchListDto {
  @ApiProperty({ type: [PymeConsultantMatchResultDto] })
  data: PymeConsultantMatchResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
