import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Checkout } from '@db/tables/checkout.table';
import { getMercadoPagoSettlement } from '@functions/mercado-pago-fee.function';
import { MeetingConsultantPayoutRepository } from '@repositories/meeting-consultant-payout.repository';
import { MeetingRescheduleHistoryRepository } from '@repositories/meeting-reschedule-history.repository';
import { StorageService } from '../../storage/storage.service';
import {
  MeetingConsultantPayoutFiltersDto,
  MeetingConsultantPayoutMarkPaidMultipartDto,
} from './dto/meeting-consultant-payout.dto';
import { MeetingRescheduleTraceabilityDto } from './dto/meeting-reschedule-traceability.dto';
import {
  MEETING_PAYOUT_EVIDENCE_MAX_BYTES,
  MEETING_PAYOUT_EVIDENCE_MIME_TYPES,
} from './meeting-consultant-payout-upload.config';

@Injectable()
export class MeetingConsultantPayoutService {
  constructor(
    private readonly payoutRepository: MeetingConsultantPayoutRepository,
    private readonly rescheduleHistoryRepository: MeetingRescheduleHistoryRepository,
    private readonly storageService: StorageService,
  ) {}

  async ensurePendingFromCheckout(checkout: Checkout) {
    if (
      checkout.collectionDestination !== 'hubsme' ||
      checkout.serviceRequestId !== null ||
      checkout.status !== 'approved' ||
      !checkout.meetingId ||
      !checkout.mercadoPagoPaymentId
    ) {
      return null;
    }

    const grossAmount = Number(checkout.amount);
    const platformCommission = Number(checkout.marketplaceFee);
    const settlement = getMercadoPagoSettlement(checkout.rawPayment, grossAmount);
    const receivedAmount = settlement.netReceivedAmount ?? grossAmount;
    const consultantAmount = Number((receivedAmount - platformCommission).toFixed(2));
    if (
      !Number.isFinite(grossAmount) ||
      !Number.isFinite(platformCommission) ||
      grossAmount <= 0 ||
      platformCommission < 0 ||
      consultantAmount <= 0
    ) {
      throw new BadRequestException('El cobro aprobado no tiene un monto válido para el consultor');
    }

    const payout = await this.payoutRepository.createPending({
      meetingId: checkout.meetingId,
      checkoutId: checkout.id,
      pymeId: checkout.pymeId,
      consultantId: checkout.consultantId,
      amount: consultantAmount.toFixed(2),
      mercadoPagoFeeAmount: settlement.feeAmount?.toFixed(2) ?? null,
      mercadoPagoFeePercent: settlement.feePercent?.toFixed(4) ?? null,
      currency: checkout.currency,
      status: 'pending',
    });

    if (!payout || payout.status === 'paid') return payout;

    return (
      (await this.payoutRepository.updatePendingFinancials(payout.id, {
        amount: consultantAmount.toFixed(2),
        mercadoPagoFeeAmount: settlement.feeAmount?.toFixed(2) ?? null,
        mercadoPagoFeePercent: settlement.feePercent?.toFixed(4) ?? null,
      })) ?? payout
    );
  }

  async findAllPaginated(filters: MeetingConsultantPayoutFiltersDto) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const result = await this.payoutRepository.findAllPaginated({
      page,
      limit,
      search: filters.search,
      consultantId: filters.consultantId,
      status: filters.status,
    });
    const totalPages = result.total > 0 ? Math.ceil(result.total / limit) : 0;

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  async markPaid(
    id: number,
    data: MeetingConsultantPayoutMarkPaidMultipartDto,
    evidence: Express.Multer.File | undefined,
    adminUsername: string,
  ) {
    const payout = await this.payoutRepository.findOne(id);
    if (!payout) {
      throw new NotFoundException(`Pago al consultor con ID ${id} no encontrado`);
    }
    if (payout.status === 'paid') {
      throw new BadRequestException('Este pago al consultor ya fue registrado');
    }

    const paymentReference = data.paymentReference?.trim();
    if (!paymentReference) {
      throw new BadRequestException('Ingresa la referencia de la transferencia');
    }
    this.validateEvidence(evidence);

    const uploaded = await this.storageService.upload(
      evidence,
      `meeting-consultant-payouts/${payout.meetingId}/${randomUUID()}`,
    );

    try {
      const updated = await this.payoutRepository.markPaid(id, {
        paymentReference,
        evidenceFileUrl: uploaded.secureUrl,
        evidenceStoragePath: uploaded.publicId,
        evidenceOriginalName: evidence.originalname.slice(0, 255),
        evidenceMimeType: evidence.mimetype,
        evidenceSizeBytes: evidence.size,
        notes: data.notes?.trim() || null,
        paidAt: new Date(),
        processedByAdmin: adminUsername,
      });
      if (!updated) {
        throw new BadRequestException('El pago ya fue procesado por otro administrador');
      }
      return updated;
    } catch (error) {
      await this.storageService.delete(uploaded.publicId).catch(() => undefined);
      throw error;
    }
  }

  async getTraceability(payoutId: number): Promise<MeetingRescheduleTraceabilityDto> {
    const payout = await this.payoutRepository.findOne(payoutId);
    if (!payout) {
      throw new NotFoundException(`Pago al consultor con ID ${payoutId} no encontrado`);
    }

    const chain = await this.rescheduleHistoryRepository.findDetailedChainByRootMeetingId(payout.meetingId);

    const history = chain.map((step, index) => ({
      id: step.id,
      createdAt: step.createdAt,
      stepIndex: index + 1,
      sourceMeetingId: step.sourceMeetingId,
      sourceMeetingTitle: step.sourceMeetingTitle,
      sourceMeetingStartTime: step.sourceMeetingStartTime,
      sourceMeetingStatus: step.sourceMeetingStatus,
      cancellationReason: step.cancellationReason,
      cancelledByName: step.cancelledByName,
      promotionCode: step.promotionCode,
      promotionCodeExpiresAt: step.promotionCodeExpiresAt,
      promotionCodeIsActive: step.promotionCodeIsActive,
      isRedeemed: step.promotionCodeRedemptionId !== null,
      redeemedAt: step.redeemedAt,
      replacementMeetingId: step.replacementMeetingId,
      replacementMeetingTitle: step.replacementMeetingTitle,
      replacementMeetingStartTime: step.replacementMeetingStartTime,
      replacementMeetingStatus: step.replacementMeetingStatus,
      replacementMeetingCompletedAt: step.replacementMeetingCompletedAt,
    }));

    const lastStepWithReplacement = [...chain].reverse().find((s) => s.replacementMeetingId !== null);

    const rootMeeting = {
      id: payout.meetingId,
      title: payout.meetingTitle,
      startTime: payout.meetingStartTime,
      status: payout.meetingStatus,
      durationMinutes: payout.meetingDurationMinutes ?? 60,
      meetingUrl: payout.meetingUrl ?? null,
      hasMeetingLink: Boolean(payout.meetingUrl),
      completedAt: payout.meetingCompletedAt ?? null,
      cancellationReason: payout.meetingCancellationReason ?? null,
      pymeName: payout.pymeName,
      consultantName: payout.consultantName,
    };

    const latestMeeting = lastStepWithReplacement?.replacementMeetingId
      ? {
          id: lastStepWithReplacement.replacementMeetingId,
          title: lastStepWithReplacement.replacementMeetingTitle || payout.meetingTitle,
          startTime: lastStepWithReplacement.replacementMeetingStartTime,
          status: lastStepWithReplacement.replacementMeetingStatus || 'solicitada',
          durationMinutes: payout.meetingDurationMinutes ?? 60,
          meetingUrl: lastStepWithReplacement.replacementMeetingUrl ?? null,
          hasMeetingLink: Boolean(lastStepWithReplacement.replacementMeetingUrl),
          completedAt: lastStepWithReplacement.replacementMeetingCompletedAt ?? null,
          cancellationReason: null,
          pymeName: payout.pymeName,
          consultantName: payout.consultantName,
        }
      : rootMeeting;

    return {
      payout: {
        id: payout.id,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        paymentReference: payout.paymentReference,
        evidenceFileUrl: payout.evidenceFileUrl,
        evidenceOriginalName: payout.evidenceOriginalName,
        evidenceMimeType: payout.evidenceMimeType,
        notes: payout.notes,
        paidAt: payout.paidAt,
        processedByAdmin: payout.processedByAdmin,
        grossAmount: payout.grossAmount,
        platformCommissionAmount: payout.platformCommissionAmount,
        mercadoPagoFeeAmount: payout.mercadoPagoFeeAmount,
        mercadoPagoFeePercent: payout.mercadoPagoFeePercent,
        mercadoPagoPaymentId: payout.mercadoPagoPaymentId,
        checkoutExternalReference: payout.checkoutExternalReference,
      },
      rootMeeting,
      latestMeeting,
      rescheduleCount: chain.length,
      history,
    };
  }

  private validateEvidence(evidence: Express.Multer.File | undefined): asserts evidence is Express.Multer.File {
    if (!evidence) {
      throw new BadRequestException('Adjunta la constancia del pago al consultor');
    }
    if (evidence.size <= 0 || evidence.size > MEETING_PAYOUT_EVIDENCE_MAX_BYTES) {
      throw new BadRequestException('La constancia debe pesar entre 1 byte y 10 MB');
    }
    if (
      !MEETING_PAYOUT_EVIDENCE_MIME_TYPES.includes(
        evidence.mimetype as (typeof MEETING_PAYOUT_EVIDENCE_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException('La constancia debe ser PDF, JPG, PNG o WEBP');
    }
  }
}
