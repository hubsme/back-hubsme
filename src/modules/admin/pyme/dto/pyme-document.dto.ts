import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { DiagnosticPayloadDto } from '@modules/admin/diagnostic/dto/diagnostic-result.dto';

export class PymeDocumentListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by document title, content or consultant name' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class PymeMeetingDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: ['solicitada', 'pago_pendiente', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  status: 'solicitada' | 'pago_pendiente' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;
}

export class PymeMeetingDocumentsDto {
  @ApiProperty({ type: [PymeMeetingDocumentDto] })
  data: PymeMeetingDocumentDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PymeDiagnosticDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: DiagnosticPayloadDto })
  result: DiagnosticPayloadDto;

  @ApiProperty()
  score: number;
}

export class PymeDiagnosticDocumentsDto {
  @ApiProperty({ type: [PymeDiagnosticDocumentDto] })
  data: PymeDiagnosticDocumentDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
