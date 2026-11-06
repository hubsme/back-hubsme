import { Trace } from '@erixcel/traceflow';
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ConsultantAvailabilityService } from '@modules/admin/modules/consultant-availability/consultant-availability.service';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';
import { MeetingConsultantPayoutService } from '@modules/admin/modules/meeting/services/meeting-consultant-payout.service';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { PayinService } from '@modules/admin/modules/monnet/modules/payin/payin.service';
import type { MonnetPayinWebhookDto } from '@modules/admin/modules/monnet/modules/webhook/dto/payin.dto';
import type { PayinTransactionResultDto } from '@modules/admin/modules/monnet/modules/payin/dto/create-bank-transfer.dto';
import type { PayinOperation } from '@modules/admin/modules/monnet/modules/payin/types/payin.type';
import type { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';
import { MonnetCreateCheckoutDto, MonnetCheckoutResultDto } from './dto/create-checkout.dto';
import { MonnetPrepareCheckoutPaymentDto } from './dto/prepare-checkout-payment.dto';
import type { CheckoutRow, MonnetCheckoutPayment } from './types/checkout.type';

@Trace({ name: 'monnet-checkout', type: 'service' })
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private readonly checkoutQuery: CheckoutQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
    private readonly pymeJoinQuery: PymeJoinQuery,
    private readonly availabilityService: ConsultantAvailabilityService,
    private readonly meetingService: MeetingService,
    private readonly payoutService: MeetingConsultantPayoutService,
    private readonly consultantService: ConsultantService,
    private readonly pymeService: PymeService,
    private readonly payinService: PayinService,
  ) {}

  async createCheckout(
    user: AuthenticatedUser,
    data: MonnetCreateCheckoutDto,
  ): Promise<MonnetCheckoutResultDto> {
    this.assertOwner(user);
    const duration = data.durationMinutes ?? 60;
    if (!Number.isInteger(duration) || duration < 60 || duration > 480)
      throw new BadRequestException('La duración debe estar entre 60 y 480 minutos');
    const times = this.normalizeTimes(data.proposedStartTimes);
    const consultant = await this.consultantJoinQuery.findByUserId(data.consultantId);
    if (!consultant) throw new NotFoundException('Consultor no encontrado');
    const amount = Number(((Number(consultant.pricePerHour) * duration) / 60).toFixed(2));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999.99)
      throw new BadRequestException('El consultor no tiene una tarifa válida');
    for (const time of times)
      await this.availabilityService.assertAvailableForMeeting(
        data.consultantId,
        new Date(time),
        duration,
      );
    const identity = this.payinService.getIdentity();
    const percent = Number(process.env.MONNET_PLATFORM_FEE_PERCENT ?? '4');
    if (!Number.isFinite(percent) || percent < 0 || percent >= 100)
      throw new ServiceUnavailableException(
        'MONNET_PLATFORM_FEE_PERCENT debe estar entre 0 y menos de 100',
      );
    const row = await this.checkoutQuery.create({
      pymeId: user.pymeId ?? user.id,
      consultantId: data.consultantId,
      externalReference: `HUBSME-${randomUUID()}`,
      status: 'created',
      collectionDestination: 'hubsme',
      amount: amount.toFixed(2),
      marketplaceFee: ((amount * percent) / 100).toFixed(2),
      currency: identity.currency,
      meetingDetails: {
        startTime: times[0],
        proposedStartTimes: times,
        durationMinutes: duration,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
      },
      rawPayment: {
        provider: 'monnet',
        monnet: {
          environment: identity.environment,
          merchantId: identity.merchantId,
          creationStatus: 'not_created',
        },
      },
    });
    return this.toResult(row);
  }

  async findCheckout(user: AuthenticatedUser, id: number): Promise<MonnetCheckoutResultDto> {
    return this.toResult(await this.findAuthorized(user, id));
  }

  async prepareCheckoutPayment(
    user: AuthenticatedUser,
    id: number,
    data: MonnetPrepareCheckoutPaymentDto,
  ): Promise<MonnetCheckoutResultDto> {
    this.assertOwner(user);
    await this.findAuthorized(user, id, true);
    const identity = this.payinService.getIdentity();
    // Se confirma la reserva antes de llamar al proveedor. Un timeout no permite crear un segundo cobro.
    const reserved = await this.checkoutQuery.transaction(async () => {
      const row = await this.checkoutQuery.lock(id);
      this.assertCheckout(row, user, true);
      if (row.status === 'approved' || row.meetingId) return { row, create: false };
      if (row.preferenceId || row.mercadoPagoPaymentId)
        throw new ConflictException(
          'Este checkout ya tiene una operación de Mercado Pago. Conserva esa operación y crea otra solicitud para pagar con Monnet.',
        );
      const payment = this.payment(row);
      if (payment) {
        this.assertIdentity(payment);
        if (payment.creationStatus === 'ready') return { row, create: false };
        if (payment.creationStatus === 'creating' || payment.creationStatus === 'uncertain')
          throw new ConflictException(
            'La operación ya fue solicitada a Monnet. Verifica su estado antes de volver a pagar.',
          );
      }
      if (!row.meetingDetails)
        throw new BadRequestException('El checkout no contiene los datos de la reunión');
      if (row.currency !== 'PEN' && row.currency !== 'USD')
        throw new BadRequestException('Moneda no soportada por Monnet');
      for (const time of this.normalizeTimes(row.meetingDetails.proposedStartTimes ?? [])) {
        await this.availabilityService.assertAvailableForMeeting(
          row.consultantId,
          new Date(time),
          row.meetingDetails.durationMinutes,
        );
      }
      const updated = await this.checkoutQuery.update(id, {
        externalReference: `HUBSME-${randomUUID()}`,
        status: 'pending',
        collectionDestination: 'hubsme',
        rawPayment: {
          provider: 'monnet',
          monnet: {
            environment: identity.environment,
            merchantId: identity.merchantId,
            creationStatus: 'creating',
          },
        },
      });
      return { row: updated, create: true };
    });
    if (!reserved.create) return this.toResult(reserved.row);
    let result: PayinTransactionResultDto;
    try {
      result = await this.payinService.createTransaction(
        {
          ...data,
          payinAmount: reserved.row.amount,
          payinCurrency: reserved.row.currency as 'PEN' | 'USD',
          payinMerchantOperationNumber: reserved.row.externalReference,
          payinProductID: `MEETING-${id}`,
          payinProductDescription: reserved.row.meetingDetails.title,
          payinProductSku: `CONSULTORIA-${reserved.row.meetingDetails.durationMinutes}`,
          payinProductQuantity: '1',
          payinCustomerCountry: 'PER',
        },
        'qr',
      );
    } catch (error) {
      await this.persistCreation(id, { creationStatus: 'uncertain' });
      throw error;
    }
    const body = this.record(result.response);
    const transactionId =
      typeof body.payinTrxOperation === 'string' ? body.payinTrxOperation : undefined;
    if (
      result.upstreamHttpStatus < 200 ||
      result.upstreamHttpStatus >= 300 ||
      body.payinErrorCode !== '0000'
    ) {
      const rejected =
        typeof body.payinErrorCode === 'string' &&
        /^00\d{2}$/.test(body.payinErrorCode) &&
        !transactionId &&
        result.upstreamHttpStatus < 500;
      await this.persistCreation(id, {
        creationStatus: rejected ? 'failed' : 'uncertain',
        transactionId,
      });
      if (rejected) {
        throw new BadRequestException(
          `Monnet rechazó los datos del pago (código ${body.payinErrorCode}). Revisa los datos del pagador.`,
        );
      }
      throw new BadGatewayException(
        'Monnet no aceptó la creación del QR. Verifica el estado antes de reintentar.',
      );
    }
    const voucher = this.record(body.experienceVoucher);
    const qrCode =
      typeof voucher.qrCode === 'string' &&
      /^data:image\/png;base64,[A-Za-z0-9+/=\r\n]+$/.test(voucher.qrCode)
        ? voucher.qrCode
        : undefined;
    const paymentUrl = this.httpsUrl(result.paymentUrl);
    if (!transactionId || (!qrCode && !paymentUrl)) {
      await this.persistCreation(id, { creationStatus: 'uncertain', transactionId });
      throw new BadGatewayException(
        'Monnet creó una operación sin entregar un QR o enlace válido. Verifica su estado.',
      );
    }
    const rawExpiration = typeof voucher.expiration === 'string' ? voucher.expiration.trim() : '';
    const expiration = rawExpiration
      ? new Date(
          /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(rawExpiration)
            ? `${rawExpiration.replace(' ', 'T')}-05:00`
            : rawExpiration,
        )
      : null;
    const expiresAt =
      expiration && Number.isFinite(expiration.getTime())
        ? expiration.toISOString()
        : new Date(Date.now() + identity.expirationMinutes * 60000).toISOString();
    return this.toResult(
      await this.persistCreation(id, {
        creationStatus: 'ready',
        transactionId,
        qrCode,
        paymentUrl,
        expiresAt,
      }),
    );
  }

  async syncCheckoutPayment(user: AuthenticatedUser, id: number): Promise<MonnetCheckoutResultDto> {
    this.assertOwner(user);
    await this.findAuthorized(user, id, true);
    return this.toResult(await this.synchronize(id));
  }

  async handleNotification(data: MonnetPayinWebhookDto) {
    this.payinService.verifyNotification(data);
    const row = await this.checkoutQuery.findByExternalReference(data.payinMerchantOperationNumber);
    if (!row || !this.payment(row)) return { received: true };
    this.assertMoney(row, data.payinAmount, data.payinCurrency);
    // La firma documentada no incluye el estado; éste se obtiene de la API de Monnet.
    await this.synchronize(row.id, true, data.payinStateID);
    return { received: true };
  }

  private async synchronize(
    id: number,
    force = false,
    notifiedState?: string,
  ): Promise<CheckoutRow> {
    const result = await this.checkoutQuery.transaction(async () => {
      const row = await this.checkoutQuery.lock(id);
      if (!row || row.serviceRequestId)
        throw new NotFoundException('Checkout de reunión no encontrado');
      const payment = this.payment(row);
      if (
        !payment ||
        payment.creationStatus === 'not_created' ||
        payment.creationStatus === 'failed'
      )
        return { row };
      this.assertIdentity(payment);
      const lastVerified = row.rawPayment?.lastVerifiedAt;
      if (!force && typeof lastVerified === 'number' && Date.now() - lastVerified < 10000)
        return { row };
      const operation = await this.payinService.getOperation(row.externalReference);
      if (!operation) {
        if (force)
          throw new BadGatewayException('Monnet aún no permite verificar la operación notificada');
        return { row };
      }
      if (
        ['5', '9'].includes(notifiedState ?? '') &&
        !['5', '9'].includes(operation.payinStateID) &&
        row.status !== 'approved'
      ) {
        throw new BadGatewayException(
          'La confirmación notificada todavía no coincide con el estado consultado en Monnet',
        );
      }
      return this.applyOperation(row, payment, operation);
    });
    if ('newMeetingId' in result && typeof result.newMeetingId === 'number') {
      this.notifyMeeting(result.newMeetingId, result.row).catch((error: unknown) =>
        this.logger.error(
          'No se pudieron enviar las notificaciones de la reunión pagada',
          error instanceof Error ? error.stack : undefined,
        ),
      );
    }
    return result.row;
  }

  private async applyOperation(
    row: CheckoutRow,
    payment: MonnetCheckoutPayment,
    operation: PayinOperation,
  ) {
    if (operation.payinMerchantOperationNumber !== row.externalReference)
      throw new BadGatewayException('La referencia de Monnet no coincide con el checkout');
    this.assertMoney(row, operation.payinAmount, operation.payinCurrency);
    const rawPayment = {
      ...row.rawPayment,
      provider: 'monnet',
      payment_method_id: 'qr',
      payment_type_id: 'bank_transfer',
      lastVerifiedAt: Date.now(),
      monnet: { ...payment, stateId: operation.payinStateID, payinId: operation.payinID },
    };
    const paid = operation.payinStateID === '5' || operation.payinStateID === '9';
    if (!paid || row.status === 'approved') {
      // Una notificación tardía no puede degradar un cobro aprobado.
      const status =
        row.status === 'approved'
          ? 'approved'
          : operation.payinStateID === '3'
            ? 'expired'
            : ['6', '10', '11'].includes(operation.payinStateID)
              ? 'rejected'
              : 'pending';
      const updated = await this.checkoutQuery.update(row.id, { status, rawPayment });
      if (updated.status === 'approved' && updated.meetingId)
        await this.payoutService.ensurePendingFromCheckout(updated);
      return { row: updated };
    }
    if (!row.meetingDetails)
      throw new BadRequestException('El checkout pagado no contiene los datos de la reunión');
    let meetingId = row.meetingId;
    const isNew = !meetingId;
    if (!meetingId) {
      const meeting = await this.meetingService.create(
        {
          pymeId: row.pymeId,
          consultantId: row.consultantId,
          proposedStartTimes: this.normalizeTimes(row.meetingDetails.proposedStartTimes ?? []),
          durationMinutes: row.meetingDetails.durationMinutes,
          title: row.meetingDetails.title,
          description: row.meetingDetails.description || undefined,
          requestedBy: 'pyme',
        },
        false,
      );
      meetingId = meeting.id;
    }
    await this.meetingService.markPaidPendingConfirmation(meetingId);
    const updated = await this.checkoutQuery.update(row.id, {
      meetingId,
      status: 'approved',
      rawPayment,
    });
    await this.payoutService.ensurePendingFromCheckout(updated);
    return { row: updated, ...(isNew ? { newMeetingId: meetingId } : {}) };
  }

  private async persistCreation(
    id: number,
    change: Partial<MonnetCheckoutPayment>,
  ): Promise<CheckoutRow> {
    return this.checkoutQuery.transaction(async () => {
      const row = await this.checkoutQuery.lock(id);
      return this.checkoutQuery.update(id, {
        rawPayment: { ...row.rawPayment, monnet: { ...this.payment(row), ...change } },
      });
    });
  }

  private async findAuthorized(
    user: AuthenticatedUser,
    id: number,
    ownerOnly = false,
  ): Promise<CheckoutRow> {
    const row = await this.checkoutQuery.findOne(id);
    this.assertCheckout(row, user, ownerOnly);
    return row;
  }

  private assertCheckout(
    row: CheckoutRow | undefined,
    user: AuthenticatedUser,
    ownerOnly: boolean,
  ): asserts row is CheckoutRow {
    if (!row || row.serviceRequestId)
      throw new NotFoundException('Checkout de reunión no encontrado');
    const participant = user.role === 'pyme' ? (user.pymeId ?? user.id) : user.id;
    if (
      (user.role === 'pyme' && row.pymeId !== participant) ||
      (user.role === 'consultor' && row.consultantId !== participant) ||
      !['pyme', 'consultor'].includes(user.role) ||
      (ownerOnly && row.pymeId !== participant)
    )
      throw new UnauthorizedException('No tienes acceso a este checkout');
  }

  private assertOwner(user: AuthenticatedUser) {
    if (user.role !== 'pyme' || user.membershipRole !== 'owner')
      throw new UnauthorizedException('Solo el dueño de la empresa puede iniciar el pago');
  }

  private assertIdentity(payment: MonnetCheckoutPayment) {
    const identity = this.payinService.getIdentity();
    if (identity.environment !== payment.environment || identity.merchantId !== payment.merchantId)
      throw new ConflictException('El checkout pertenece a otro entorno o comercio de Monnet');
  }

  private assertMoney(row: CheckoutRow, amount: string, currency: string) {
    if (
      currency !== row.currency ||
      !/^\d+(?:\.\d{1,2})?$/.test(amount) ||
      Number(amount) !== Number(row.amount)
    )
      throw new BadRequestException(
        'El importe o la moneda de Monnet no coinciden con el checkout',
      );
  }

  private normalizeTimes(values: string[]): string[] {
    const times = values.map((value) => new Date(value));
    if (times.some((time) => !Number.isFinite(time.getTime())))
      throw new BadRequestException('Horario inválido');
    const unique = [...new Set(times.map((time) => time.toISOString()))].sort();
    if (unique.length !== 3)
      throw new BadRequestException('Selecciona exactamente tres horarios distintos');
    return unique;
  }

  private payment(row: CheckoutRow): MonnetCheckoutPayment | null {
    if (row.rawPayment?.provider !== 'monnet') return null;
    const value = this.record(row.rawPayment.monnet);
    if (
      (value.environment !== 'cert' && value.environment !== 'production') ||
      typeof value.merchantId !== 'string' ||
      !['not_created', 'creating', 'ready', 'uncertain', 'failed'].includes(
        String(value.creationStatus),
      )
    )
      return null;
    return value as MonnetCheckoutPayment;
  }

  private record(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private httpsUrl(value: unknown): string | undefined {
    try {
      if (typeof value === 'string' && new URL(value).protocol === 'https:') return value;
    } catch {
      /* Respuesta inválida del proveedor. */
    }
    return undefined;
  }

  private toResult(row: CheckoutRow): MonnetCheckoutResultDto {
    const payment = this.payment(row);
    return {
      id: row.id,
      meetingId: row.meetingId,
      pymeId: row.pymeId,
      consultantId: row.consultantId,
      status: row.status,
      amount: row.amount,
      marketplaceFee: row.marketplaceFee,
      currency: row.currency,
      meetingDetails: row.meetingDetails
        ? {
            ...row.meetingDetails,
            proposedStartTimes: row.meetingDetails.proposedStartTimes ?? [
              row.meetingDetails.startTime,
            ],
          }
        : null,
      paymentUrl: payment?.paymentUrl ?? null,
      qrCode: payment?.qrCode ?? null,
      expiresAt: payment?.expiresAt ?? null,
      environment: payment?.environment ?? null,
      canCreatePayment:
        !row.meetingId &&
        row.status !== 'approved' &&
        !row.preferenceId &&
        !row.mercadoPagoPaymentId &&
        (!payment || ['not_created', 'failed'].includes(payment.creationStatus)),
    };
  }

  private async notifyMeeting(id: number, row: CheckoutRow) {
    const [consultant, pyme] = await Promise.all([
      this.consultantJoinQuery.findOne(row.consultantId),
      this.pymeJoinQuery.findOne(row.pymeId),
    ]);
    const details = row.meetingDetails;
    if (!details) return;
    const times = this.normalizeTimes(details.proposedStartTimes ?? []).map(
      (value) => new Date(value),
    );
    await Promise.allSettled([
      this.consultantService.sendMeetingPendingConfirmationNotification(
        id,
        row.consultantId,
        pyme?.name || 'PYME',
        details.title,
        times,
        details.durationMinutes,
        details.description,
      ),
      this.pymeService.sendMeetingPendingConfirmationNotification(
        row.pymeId,
        consultant?.fullName || 'Consultor',
        details.title,
        times,
        details.durationMinutes,
        details.description,
      ),
    ]);
  }
}
