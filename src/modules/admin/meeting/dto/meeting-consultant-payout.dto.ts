import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class MeetingConsultantPayoutFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Busca por reunión, PYME, consultor, referencia o pago de Mercado Pago' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ enum: ['pending', 'paid'] })
  @IsIn(['pending', 'paid'])
  @IsOptional()
  status?: 'pending' | 'paid';
}

export class MeetingConsultantPayoutResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  meetingId: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  amount: string;

  @ApiProperty({ nullable: true, description: 'Cargo retenido por Mercado Pago' })
  mercadoPagoFeeAmount: string | null;

  @ApiProperty({ nullable: true, description: 'Porcentaje efectivo retenido por Mercado Pago sobre el cobro bruto' })
  mercadoPagoFeePercent: string | null;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ['pending', 'paid'] })
  status: 'pending' | 'paid';

  @ApiProperty({ nullable: true })
  paymentReference: string | null;

  @ApiProperty({ nullable: true })
  evidenceFileUrl: string | null;

  @ApiProperty({ nullable: true })
  evidenceStoragePath: string | null;

  @ApiProperty({ nullable: true })
  evidenceOriginalName: string | null;

  @ApiProperty({ nullable: true })
  evidenceMimeType: string | null;

  @ApiProperty({ nullable: true })
  evidenceSizeBytes: number | null;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty({ nullable: true })
  paidAt: Date | null;

  @ApiProperty({ nullable: true })
  processedByAdmin: string | null;

  @ApiProperty()
  meetingTitle: string;

  @ApiProperty({ nullable: true })
  meetingStartTime: Date | null;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  meetingStatus: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  checkoutExternalReference: string;

  @ApiProperty({ description: 'Total que la PYME pagó y que ingresó a la cuenta de Hubsme' })
  grossAmount: string;

  @ApiProperty({ description: 'Comisión contable retenida por Hubsme' })
  platformCommissionAmount: string;

  @ApiProperty({ description: 'Número de reagendamientos asociados a esta reunión' })
  rescheduleCount: number;

  @ApiProperty({ description: 'ID de la última reunión activa o más reciente en la cadena' })
  latestMeetingId: number;

  @ApiProperty({ description: 'Título de la última reunión activa en la cadena' })
  latestMeetingTitle: string;

  @ApiProperty({ nullable: true, description: 'Fecha y hora de inicio de la última reunión' })
  latestMeetingStartTime: Date | null;

  @ApiProperty({
    enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'],
    description: 'Estado de la última reunión en la cadena',
  })
  latestMeetingStatus: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';
}

export class MeetingConsultantPayoutListDto {
  @ApiProperty({ type: [MeetingConsultantPayoutResultDto] })
  data: MeetingConsultantPayoutResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class MeetingConsultantPayoutMarkPaidMultipartDto {
  @ApiProperty({ maxLength: 180, example: 'TRANSFERENCIA-MP-123456' })
  @IsString()
  @MaxLength(180)
  paymentReference: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: 'string', format: 'binary', description: 'Constancia PDF, JPG, PNG o WEBP de máximo 10 MB' })
  evidence: string;
}
