import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { PymeMeetingDocumentDto } from '@modules/admin/modules/pyme/dto/find-all.dto';

@Trace({ type: 'validation' })
export class PymeDocumentListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by document title, content or consultant name' })
  @IsString()
  @IsOptional()
  search?: string;
}

@Trace({ type: 'validation' })
export class PymeMeetingDocumentsDto {
  @ApiProperty({ type: () => [PymeMeetingDocumentDto] })
  data: PymeMeetingDocumentDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
