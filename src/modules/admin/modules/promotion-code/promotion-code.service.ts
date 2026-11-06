import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { MeetingRescheduleHistoryQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history.query';
import { PromotionCodeRedemptionJoinQuery } from '@queries/promotion-code-redemption/promotion-code-redemption-join.query';
import { PromotionCodeRedemptionQuery } from '@queries/promotion-code-redemption/promotion-code-redemption.query';
import { PromotionCodeQuery } from '@queries/promotion-code/promotion-code.query';

import { Trace } from '@erixcel/traceflow';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';
import { PromotionCodeCreateDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/create.dto';
import { PromotionCodeListFiltersDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/find-all.dto';
import { PromotionCodeUpdateDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/update.dto';
import { PromotionCodeRedeemServiceDto } from '@modules/admin/modules/promotion-code/dto/redeem-service.dto';
import { PromotionCodeRedeemDto } from '@modules/admin/modules/promotion-code/dto/redeem.dto';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { ServiceRequestService } from '@modules/admin/modules/service-request/service-request.service';
import { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

// Gestiona los códigos promocionales y sus canjes.
@Trace({ name: 'promotion-code', type: 'service' })
@Injectable()
export class PromotionCodeService {
  private readonly logger = new Logger(PromotionCodeService.name);

  constructor(
    private readonly meetingService: MeetingService,
    private readonly consultantService: ConsultantService,
    private readonly pymeService: PymeService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly promotionCodeQuery: PromotionCodeQuery,
    private readonly promotionCodeRedemptionJoinQuery: PromotionCodeRedemptionJoinQuery,
    private readonly checkoutQuery: CheckoutQuery,
    private readonly promotionCodeRedemptionQuery: PromotionCodeRedemptionQuery,
    private readonly meetingRescheduleHistoryQuery: MeetingRescheduleHistoryQuery,
  ) {}

  async findAllPaginated(filters: PromotionCodeListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } = await this.promotionCodeQuery.findAllPaginated(page, limit, filters.search);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findDetail(id: number) {
    const promotionCode = await this.promotionCodeQuery.findOne(id);
    if (!promotionCode) {
      throw new NotFoundException(`Promotion code with ID ${id} not found`);
    }

    const redemptions = await this.promotionCodeRedemptionJoinQuery.findRedemptionsByPromotionCode(id);

    return {
      ...promotionCode,
      redemptions: redemptions.map((redemption) => ({
        ...redemption,
        pymeName: redemption.pymeName ?? `PYME #${redemption.pymeId}`,
        consultantName: redemption.consultantName ?? `Consultor #${redemption.consultantId}`,
      })),
    };
  }

  async create(data: PromotionCodeCreateDto) {
    this.assertDateRange(data.startsAt, data.expiresAt);

    try {
      return await this.promotionCodeQuery.create({
        code: this.normalizeCode(data.code || this.generateCode()),
        type: data.type ?? 'consultation',
        description: data.description?.trim() || null,
        maxRedemptions: data.maxRedemptions,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
        allowedPymeIds: data.allowedPymeIds ?? null,
        allowedConsultantIds: data.allowedConsultantIds ?? null,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(['El código promocional ya existe']);
      }
      throw error;
    }
  }

  async update(id: number, data: PromotionCodeUpdateDto) {
    const current = await this.promotionCodeQuery.findOne(id);
    if (!current) {
      throw new NotFoundException(`Promotion code with ID ${id} not found`);
    }

    if (data.maxRedemptions !== undefined && data.maxRedemptions < current.redemptionCount) {
      throw new BadRequestException(['El máximo de usos no puede ser menor a los usos ya realizados']);
    }
    if (data.type && data.type !== current.type && current.redemptionCount > 0) {
      throw new BadRequestException(['No puedes cambiar el tipo de un cupón que ya fue canjeado']);
    }

    const startsAt = data.startsAt ?? current.startsAt ?? undefined;
    const expiresAt = data.expiresAt ?? current.expiresAt ?? undefined;
    this.assertDateRange(startsAt, expiresAt);

    try {
      return await this.promotionCodeQuery.update(id, {
        ...data,
        code: data.code ? this.normalizeCode(data.code) : undefined,
        description: data.description === undefined ? undefined : data.description.trim() || null,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(['El código promocional ya existe']);
      }
      throw error;
    }
  }

  async redeem(currentUserId: number, data: PromotionCodeRedeemDto) {
    return this.checkoutQuery.transaction(async () => {
      await this.checkoutQuery.lock(data.checkoutId);
      return this.redeemCheckout(currentUserId, data);
    });
  }

  private async redeemCheckout(currentUserId: number, data: PromotionCodeRedeemDto) {
    const checkout = await this.checkoutQuery.findOne(data.checkoutId);
    if (!checkout) {
      throw new NotFoundException(`Mercado Pago checkout with ID ${data.checkoutId} not found`);
    }
    if (checkout.pymeId !== currentUserId) {
      throw new UnauthorizedException('No tienes acceso a este checkout');
    }

    const previousRedemption = await this.promotionCodeRedemptionQuery.findRedemptionByCheckout(checkout.id);
    if (previousRedemption?.meetingId) {
      return {
        meetingId: previousRedemption.meetingId,
        checkoutId: checkout.id,
        code: this.normalizeCode(data.code),
        message: 'Consultoría gratuita registrada por confirmación',
      };
    }

    if (checkout.meetingId || checkout.status === 'approved') {
      throw new BadRequestException(['Este checkout ya fue pagado']);
    }
    if (!checkout.meetingDetails) {
      throw new BadRequestException(['El checkout no contiene los datos de la reunión']);
    }

    const monnet = checkout.rawPayment?.monnet;
    if (checkout.rawPayment?.provider === 'monnet' && monnet && typeof monnet === 'object' && 'creationStatus' in monnet && !['not_created', 'failed'].includes(String(monnet.creationStatus))) {
      throw new BadRequestException('Aplica el código antes de generar el QR. Este checkout ya tiene una operación de pago.');
    }

    const claim = await this.claimPromotion(this.normalizeCode(data.code), 'consultation', checkout.id, checkout.pymeId, checkout.consultantId);
    if (!claim) {
      throw new BadRequestException(['El código no existe, venció o ya alcanzó su límite de usos']);
    }

    let meetingId: number | undefined;
    try {
      const meeting = await this.meetingService.create({
        pymeId: checkout.pymeId,
        consultantId: checkout.consultantId,
        proposedStartTimes: checkout.meetingDetails.proposedStartTimes ?? [checkout.meetingDetails.startTime],
        durationMinutes: checkout.meetingDetails.durationMinutes,
        title: checkout.meetingDetails.title,
        description: checkout.meetingDetails.description || undefined,
        requestedBy: 'pyme',
      });
      meetingId = meeting.id;

      await this.meetingService.markPaidPendingConfirmation(meeting.id);
      await this.finalizePromotionClaim(claim.redemption.id, checkout.id, meeting.id, {
        source: 'promotion_code',
        promotionCodeId: claim.promotion.id,
        promotionCode: claim.promotion.code,
        redemptionId: claim.redemption.id,
      });
      await this.meetingRescheduleHistoryQuery.updateReplacementByPromotionCodeId(claim.promotion.id, {
        replacementMeetingId: meeting.id,
        promotionCodeRedemptionId: claim.redemption.id,
      });
      await this.sendMeetingNotifications(meeting.id);

      return {
        meetingId: meeting.id,
        checkoutId: checkout.id,
        code: claim.promotion.code,
        message: 'Consultoría gratuita registrada por confirmación',
      };
    } catch (error) {
      if (meetingId) {
        await this.meetingService.delete(meetingId).catch(() => undefined);
      }
      await this.releasePromotionClaim(claim.redemption.id);
      throw error;
    }
  }

  redeemForUser(currentUser: AuthenticatedUser, data: PromotionCodeRedeemDto) {
    return this.redeem(this.requirePymeOwnerId(currentUser), data);
  }

  async redeemService(currentUserId: number, data: PromotionCodeRedeemServiceDto) {
    const serviceRequest = await this.serviceRequestService.findPayableForPyme(data.serviceRequestId, currentUserId);
    const installment = serviceRequest.paymentSchedule.find((item) => item.status !== 'approved');
    if (!installment) {
      throw new BadRequestException(['Todas las cuotas de este servicio ya fueron pagadas']);
    }
    if (!installment.available) {
      throw new BadRequestException([installment.availabilityMessage ?? 'La siguiente cuota todavía no está disponible']);
    }

    const amount = Number(installment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(['No se pudo calcular el monto de la siguiente cuota']);
    }

    let checkout = await this.checkoutQuery.findByServiceRequestInstallment(serviceRequest.id, installment.installmentIndex);
    if (checkout?.status === 'approved') {
      throw new ConflictException('La cuota ya fue pagada');
    }
    if (checkout?.preferenceId && (checkout.initPoint || checkout.sandboxInitPoint)) {
      throw new ConflictException('Ya existe un pago iniciado para esta cuota');
    }

    if (!checkout) {
      checkout = await this.checkoutQuery.create({
        meetingId: null,
        serviceRequestId: serviceRequest.id,
        serviceInstallmentIndex: installment.installmentIndex,
        pymeId: serviceRequest.pymeId,
        consultantId: serviceRequest.consultantId,
        preferenceId: null,
        initPoint: null,
        sandboxInitPoint: null,
        externalReference: this.buildServicePaymentReference(serviceRequest.id, installment.installmentIndex),
        status: 'created',
        amount: amount.toFixed(2),
        marketplaceFee: '0.00',
        currency: serviceRequest.currency,
      });
    }

    const claim = await this.claimPromotion(this.normalizeCode(data.code), 'service', checkout.id, checkout.pymeId, checkout.consultantId);
    if (!claim) {
      throw new BadRequestException(['El código no existe, venció o ya alcanzó su límite de usos']);
    }

    let finalized = false;
    try {
      const redemption = await this.finalizeServicePromotionClaim(claim.redemption.id, checkout.id, {
        source: 'promotion_code',
        promotionCodeId: claim.promotion.id,
        promotionCode: claim.promotion.code,
        redemptionId: claim.redemption.id,
        serviceRequestId: serviceRequest.id,
        serviceInstallmentIndex: installment.installmentIndex,
      });
      if (!redemption) {
        throw new ConflictException('La cuota fue pagada por otro proceso');
      }
      finalized = true;

      await this.serviceRequestService.markPaid(serviceRequest.id);

      return {
        serviceRequestId: serviceRequest.id,
        installmentIndex: installment.installmentIndex,
        checkoutId: checkout.id,
        code: claim.promotion.code,
        message: 'Cuota de servicio confirmada con cupón',
      };
    } catch (error) {
      if (!finalized) {
        await this.releasePromotionClaim(claim.redemption.id);
      }
      throw error;
    }
  }

  redeemServiceForUser(currentUser: AuthenticatedUser, data: PromotionCodeRedeemServiceDto) {
    return this.redeemService(this.requirePymeOwnerId(currentUser), data);
  }

  private requirePymeOwnerId(currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'pyme' || currentUser.membershipRole !== 'owner' || !currentUser.pymeId) {
      throw new ForbiddenException('Solo el propietario de la PYME puede canjear códigos');
    }
    return currentUser.pymeId;
  }

  private async sendMeetingNotifications(meetingId: number) {
    try {
      const meeting = await this.meetingService.findOne(meetingId);
      const [consultant, pyme] = await Promise.all([this.consultantService.findOne(meeting.consultantId), this.pymeService.findOne(meeting.pymeId)]);

      await Promise.all([
        this.consultantService.sendMeetingPendingConfirmationNotification(
          meeting.id,
          meeting.consultantId,
          pyme.name,
          meeting.title,
          (meeting.proposedStartTimes ?? []).map((value) => new Date(value)),
          meeting.durationMinutes,
          meeting.description,
        ),
        this.pymeService.sendMeetingPendingConfirmationNotification(
          meeting.pymeId,
          consultant.fullName,
          meeting.title,
          (meeting.proposedStartTimes ?? []).map((value) => new Date(value)),
          meeting.durationMinutes,
          meeting.description,
        ),
      ]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`No se pudieron enviar las notificaciones de la reunion ${meetingId}: ${message}`);
    }
  }

  private normalizeCode(code: string) {
    const normalized = code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!normalized) {
      throw new BadRequestException(['El código promocional no es válido']);
    }
    return normalized;
  }

  private generateCode() {
    return `HUBSME-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private buildServicePaymentReference(serviceRequestId: number, installmentIndex: number) {
    return `service-hubsme:${serviceRequestId}:${installmentIndex}:promotion-code`;
  }

  private assertDateRange(startsAt?: Date, expiresAt?: Date) {
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new BadRequestException(['La fecha de vencimiento debe ser posterior a la fecha de inicio']);
    }
  }

  private isUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }

  private async claimPromotion(code: string, type: Awaited<ReturnType<PromotionCodeQuery['findOne']>>['type'], checkoutId: number, pymeId: number, consultantId: number) {
    try {
      return await this.promotionCodeQuery.transaction(async () => {
        const existing = await this.promotionCodeRedemptionQuery.findAllByCheckout(checkoutId);
        if (existing[0]) {
          const codeResult = await this.promotionCodeQuery.findClaimedPromotion(existing[0].promotionCodeId, code, type);
          return codeResult[0] ? { promotion: codeResult[0], redemption: existing[0] } : undefined;
        }

        const now = new Date();
        const claimedCodes = await this.promotionCodeQuery.claimAvailable(code, type, pymeId, consultantId, now);

        if (!claimedCodes[0]) return undefined;

        const redemptions = await this.promotionCodeRedemptionQuery.create({
          promotionCodeId: claimedCodes[0].id,
          checkoutId,
          pymeId,
          consultantId,
        });

        return { promotion: claimedCodes[0], redemption: redemptions[0] };
      });
    } catch (error) {
      if (!this.isClaimUniqueViolation(error)) throw error;

      const existing = await this.promotionCodeRedemptionQuery.findRedemptionByCheckout(checkoutId);
      if (!existing) return undefined;
      const existingCode = await this.promotionCodeQuery.findOne(existing.promotionCodeId);
      return existingCode?.code === code && existingCode.type === type ? { promotion: existingCode, redemption: existing } : undefined;
    }
  }

  private async finalizePromotionClaim(redemptionId: number, checkoutId: number, meetingId: number, rawPayment: Record<string, unknown>) {
    return this.promotionCodeQuery.transaction(async () => {
      await this.checkoutQuery.approveWithPromotionCode(checkoutId, meetingId, rawPayment);

      const result = await this.promotionCodeRedemptionQuery.linkMeeting(redemptionId, meetingId);
      return result[0];
    });
  }

  private async finalizeServicePromotionClaim(redemptionId: number, checkoutId: number, rawPayment: Record<string, unknown>) {
    return this.promotionCodeQuery.transaction(async () => {
      const approvedCheckouts = await this.checkoutQuery.approveServiceWithPromotionCode(checkoutId, rawPayment);

      if (!approvedCheckouts[0]) return undefined;

      const result = await this.promotionCodeRedemptionQuery.touchClaim(redemptionId);
      return result[0];
    });
  }

  private async releasePromotionClaim(redemptionId: number) {
    return this.promotionCodeQuery.transaction(async () => {
      const released = await this.promotionCodeRedemptionQuery.releaseUnusedClaim(redemptionId);

      if (!released[0]) return;

      await this.promotionCodeQuery.releaseRedemptionCount(released[0].promotionCodeId);
    });
  }

  private isClaimUniqueViolation(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
