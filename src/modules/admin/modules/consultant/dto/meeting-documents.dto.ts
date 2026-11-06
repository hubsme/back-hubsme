import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { ConsultantMeetingDocumentDto } from '@modules/admin/modules/consultant/dto/find-all.dto';

@Trace({ type: 'validation' })
export class ConsultantDocumentListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by document title, content or PYME name' })
  @IsString()
  @IsOptional()
  search?: string;
}

@Trace({ type: 'validation' })
export class ConsultantMeetingDocumentsDto {
  @ApiProperty({ type: () => [ConsultantMeetingDocumentDto] })
  data: ConsultantMeetingDocumentDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
