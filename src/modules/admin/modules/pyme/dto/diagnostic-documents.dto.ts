import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@dto/pagination.dto';
import { PymeDiagnosticDocumentDto } from '@modules/admin/modules/pyme/dto/find-all.dto';

@Trace({ type: 'validation' })
export class PymeDiagnosticDocumentsDto {
  @ApiProperty({ type: () => [PymeDiagnosticDocumentDto] })
  data: PymeDiagnosticDocumentDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
