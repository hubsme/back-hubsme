import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  checkoutExternalReference: string;
}

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

export class MeetingRescheduleTraceabilityDto {
  @ApiProperty({ type: MeetingTraceabilityPayoutSummaryDto })
  payout: MeetingTraceabilityPayoutSummaryDto;

  @ApiProperty({ type: MeetingTraceabilityMeetingSummaryDto })
  rootMeeting: MeetingTraceabilityMeetingSummaryDto;

  @ApiProperty({ type: MeetingTraceabilityMeetingSummaryDto })
  latestMeeting: MeetingTraceabilityMeetingSummaryDto;

  @ApiProperty({ description: 'Total de veces que la reunión fue cancelada y reagendada' })
  rescheduleCount: number;

  @ApiProperty({ type: [MeetingRescheduleStepDto] })
  history: MeetingRescheduleStepDto[];
}
