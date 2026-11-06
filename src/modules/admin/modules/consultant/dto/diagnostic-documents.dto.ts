import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@dto/pagination.dto';
import { ConsultantDiagnosticDocumentDto } from '@modules/admin/modules/consultant/dto/find-all.dto';

@Trace({ type: 'validation' })
export class ConsultantDiagnosticDocumentsDto {
  @ApiProperty({ type: () => [ConsultantDiagnosticDocumentDto] })
  data: ConsultantDiagnosticDocumentDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
