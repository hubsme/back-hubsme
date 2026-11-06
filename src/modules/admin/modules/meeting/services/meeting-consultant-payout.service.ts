import type { CheckoutQuery } from '@queries/checkout/checkout.query';
import { MeetingConsultantPayoutJoinQuery } from '@queries/meeting-consultant-payout/meeting-consultant-payout-join.query';
import { MeetingConsultantPayoutQuery } from '@queries/meeting-consultant-payout/meeting-consultant-payout.query';
import { MeetingRescheduleHistoryJoinQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history-join.query';

import { Trace } from '@erixcel/traceflow';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { MercadoPagoFeeFunction } from '@functions/mercado-pago-fee.function';
import { MEETING_PAYOUT_EVIDENCE_MAX_BYTES, MEETING_PAYOUT_EVIDENCE_MIME_TYPES } from '@modules/admin/modules/meeting/config/meeting-consultant-payout-upload.config';
import { MeetingConsultantPayoutFiltersDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/find-all-payouts.dto';
import { MeetingRescheduleTraceabilityDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/get-payout-traceability.dto';
import { MeetingConsultantPayoutMarkPaidMultipartDto } from '@modules/admin/modules/meeting/controllers/meeting-admin/dto/mark-payout-paid.dto';
import { StorageService } from '@modules/storage/storage.service';

// Gestiona los pagos pendientes y registrados de los consultores.
@Trace({ name: 'meeting-consultant-payout', type: 'service' })
@Injectable()
export class MeetingConsultantPayoutService {
  constructor(
    private readonly storageService: StorageService,
    private readonly meetingConsultantPayoutJoinQuery: MeetingConsultantPayoutJoinQuery,
    private readonly meetingRescheduleHistoryJoinQuery: MeetingRescheduleHistoryJoinQuery,
    private readonly meetingConsultantPayoutQuery: MeetingConsultantPayoutQuery,
  ) {}

  async ensurePendingFromCheckout(checkout: Awaited<ReturnType<CheckoutQuery['findOne']>>) {
    if (checkout.collectionDestination !== 'hubsme' || checkout.serviceRequestId !== null || checkout.status !== 'approved' || !checkout.meetingId || (!checkout.mercadoPagoPaymentId && checkout.rawPayment?.provider !== 'monnet')) {
      return null;
    }

    const grossAmount = Number(checkout.amount);
    const platformCommission = Number(checkout.marketplaceFee);
    // Las comisiones de Monnet quedan desconocidas hasta la conciliación; no se registran como cero.
    const settlement = checkout.rawPayment?.provider === 'monnet' ? { netReceivedAmount: null, feeAmount: null, feePercent: null } : MercadoPagoFeeFunction.getMercadoPagoSettlement(checkout.rawPayment, grossAmount);
    const receivedAmount = settlement.netReceivedAmount ?? grossAmount;
    const consultantAmount = Number((receivedAmount - platformCommission).toFixed(2));
    if (!Number.isFinite(grossAmount) || !Number.isFinite(platformCommission) || grossAmount <= 0 || platformCommission < 0 || consultantAmount <= 0) {
      throw new BadRequestException('El cobro aprobado no tiene un monto válido para el consultor');
    }

    const payout = await this.createPendingPayout({
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
      (await this.updatePayoutFinancials(payout.id, {
        amount: consultantAmount.toFixed(2),
        mercadoPagoFeeAmount: settlement.feeAmount?.toFixed(2) ?? null,
        mercadoPagoFeePercent: settlement.feePercent?.toFixed(4) ?? null,
      })) ?? payout
    );
  }

  async findAllPaginated(filters: MeetingConsultantPayoutFiltersDto) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 100);
    const result = await this.meetingConsultantPayoutJoinQuery.findAllPaginated({
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

  async markPaid(id: number, data: MeetingConsultantPayoutMarkPaidMultipartDto, evidence: Express.Multer.File | undefined, adminUsername: string) {
    const payout = await this.meetingConsultantPayoutJoinQuery.findOne(id);
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

    const uploaded = await this.storageService.upload(evidence, `meeting-consultant-payouts/${payout.meetingId}/${randomUUID()}`);

    try {
      const updated = await this.persistPayoutPayment(id, {
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
    const payout = await this.meetingConsultantPayoutJoinQuery.findOne(payoutId);
    if (!payout) {
      throw new NotFoundException(`Pago al consultor con ID ${payoutId} no encontrado`);
    }

    const chain = await this.meetingRescheduleHistoryJoinQuery.findDetailedChainByRootMeetingId(payout.meetingId);

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
    if (!MEETING_PAYOUT_EVIDENCE_MIME_TYPES.includes(evidence.mimetype as (typeof MEETING_PAYOUT_EVIDENCE_MIME_TYPES)[number])) {
      throw new BadRequestException('La constancia debe ser PDF, JPG, PNG o WEBP');
    }
  }

  private async createPendingPayout(data: Parameters<MeetingConsultantPayoutQuery['createPending']>[0]) {
    const inserted = await this.meetingConsultantPayoutQuery.createPending(data);
    if (inserted) return this.meetingConsultantPayoutJoinQuery.findOne(inserted.id);
    return (await this.meetingConsultantPayoutJoinQuery.findByCheckoutId(data.checkoutId)) ?? this.meetingConsultantPayoutJoinQuery.findByMeetingId(data.meetingId);
  }
  private async updatePayoutFinancials(id: number, data: Parameters<MeetingConsultantPayoutQuery['updatePendingFinancials']>[1]) {
    const updated = await this.meetingConsultantPayoutQuery.updatePendingFinancials(id, data);
    return updated ? this.meetingConsultantPayoutJoinQuery.findOne(updated.id) : undefined;
  }
  private async persistPayoutPayment(id: number, data: Parameters<MeetingConsultantPayoutQuery['markPaid']>[1]) {
    const updated = await this.meetingConsultantPayoutQuery.markPaid(id, data);
    return updated ? this.meetingConsultantPayoutJoinQuery.findOne(updated.id) : undefined;
  }
}
