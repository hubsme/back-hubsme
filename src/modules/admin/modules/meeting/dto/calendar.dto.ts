import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';

@Trace({ type: 'validation' })
export class MeetingCalendarFiltersDto extends PaginationFiltersDto {
  @ApiProperty({
    description: 'Inclusive beginning of the visible calendar range',
    example: '2026-07-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Exclusive end of the visible calendar range',
    example: '2026-08-01T00:00:00.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    required: false,
    enum: ['solicitada', 'pendiente', 'confirmada', 'finalizada', 'cancelada'],
    description: 'Estado visible. Pendiente agrupa pago pendiente y por confirmar.',
  })
  @IsIn(['solicitada', 'pendiente', 'confirmada', 'finalizada', 'cancelada'])
  @IsOptional()
  status?: 'solicitada' | 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada';
}

@Trace({ type: 'validation' })
export class MeetingCalendarItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty({ nullable: true })
  serviceMilestoneIndex: number | null;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true, type: String })
  consultantPhotoUrl: string | null;

  @ApiProperty({ example: '150.00' })
  consultantPricePerHour: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true, type: Date })
  startTime: Date | null;

  @ApiProperty({ type: [String] })
  proposedStartTimes: string[];

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ description: 'Indica si la reunión tiene un acceso virtual configurado' })
  hasMeetingLink: boolean;

  @ApiProperty({
    enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'],
  })
  status: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  requestedBy: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['consultoria', 'servicio'] })
  meetingType: 'consultoria' | 'servicio';

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ nullable: true, type: String })
  cancellationReason: string | null;

  @ApiProperty({ nullable: true, type: Date })
  completedAt: Date | null;
}

@Trace({ type: 'validation' })
export class MeetingCalendarListDto {
  @ApiProperty({ type: () => [MeetingCalendarItemDto] })
  data: MeetingCalendarItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

export const meetingStatuses = ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] as const;

@Trace({ type: 'validation' })
export class MeetingStatusDto {
  @ApiProperty({ enum: meetingStatuses })
  @IsIn(meetingStatuses)
  status: (typeof meetingStatuses)[number];
}

@Trace({ type: 'validation' })
export class MeetingRescheduleStepDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ description: 'Índice o número de orden del paso de reagendamiento' })
  stepIndex: number;

  @ApiProperty()
  sourceMeetingId: number;

  @ApiProperty()
  sourceMeetingTitle: string;

  @ApiProperty({ nullable: true })
  sourceMeetingStartTime: Date | null;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  sourceMeetingStatus: string;

  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ nullable: true })
  cancelledByName: string | null;

  @ApiProperty()
  promotionCode: string;

  @ApiProperty({ nullable: true })
  promotionCodeExpiresAt: Date | null;

  @ApiProperty()
  promotionCodeIsActive: boolean;

  @ApiProperty()
  isRedeemed: boolean;

  @ApiProperty({ nullable: true })
  redeemedAt: Date | null;

  @ApiProperty({ nullable: true })
  replacementMeetingId: number | null;

  @ApiProperty({ nullable: true })
  replacementMeetingTitle: string | null;

  @ApiProperty({ nullable: true })
  replacementMeetingStartTime: Date | null;

  @ApiProperty({ nullable: true, enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  replacementMeetingStatus: string | null;

  @ApiProperty({ nullable: true })
  replacementMeetingCompletedAt: Date | null;
}

@Trace({ type: 'validation' })
export class MeetingTraceabilityPayoutSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: ['pending', 'paid'] })
  status: 'pending' | 'paid';

  @ApiProperty({ nullable: true })
  paymentReference: string | null;

  @ApiProperty({ nullable: true })
  evidenceFileUrl: string | null;

  @ApiProperty({ nullable: true })
  evidenceOriginalName: string | null;

  @ApiProperty({ nullable: true })
  evidenceMimeType: string | null;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty({ nullable: true })
  paidAt: Date | null;

  @ApiProperty({ nullable: true })
  processedByAdmin: string | null;

  @ApiProperty()
  grossAmount: string;

  @ApiProperty()
  platformCommissionAmount: string;

  @ApiProperty({ nullable: true, description: 'Cargo retenido por Mercado Pago' })
  mercadoPagoFeeAmount: string | null;

  @ApiProperty({ nullable: true, description: 'Porcentaje efectivo retenido por Mercado Pago sobre el cobro bruto' })
  mercadoPagoFeePercent: string | null;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  checkoutExternalReference: string;
}

@Trace({ type: 'validation' })
export class MeetingTraceabilityMeetingSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  status: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ nullable: true })
  meetingUrl: string | null;

  @ApiProperty()
  hasMeetingLink: boolean;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantName: string;
}
