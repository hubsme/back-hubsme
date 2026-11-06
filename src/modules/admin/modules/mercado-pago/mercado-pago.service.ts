import { Trace } from '@erixcel/traceflow';
import { CheckoutService as MonnetCheckoutService } from '@modules/admin/modules/monnet/modules/checkout/checkout.service';
import { MonnetPrepareCheckoutPaymentDto } from '@modules/admin/modules/monnet/modules/checkout/dto/prepare-checkout-payment.dto';
import type {
  MeetingDetails,
  MercadoPagoPaymentResponse,
  MercadoPagoPaymentSearchResponse,
  MercadoPagoPreferenceResponse,
  MercadoPagoState,
  MercadoPagoTokenResponse,
  MercadoPagoUserResponse,
} from '@modules/admin/modules/mercado-pago/types/mercado-pago.type';
import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CheckoutJoinQuery } from '@queries/checkout/checkout-join.query';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { ConsultantMercadoPagoAccountQuery } from '@queries/consultant-mercado-pago-account/consultant-mercado-pago-account.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import type { ConsultantQuery } from '@queries/consultant/consultant.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';

import { ConsultantAvailabilityService } from '@modules/admin/modules/consultant-availability/consultant-availability.service';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';
import { MeetingConsultantPayoutService } from '@modules/admin/modules/meeting/services/meeting-consultant-payout.service';
import { MercadoPagoAuthUrlDto } from '@modules/admin/modules/mercado-pago/dto/auth-url.dto';
import { MercadoPagoCallbackDto } from '@modules/admin/modules/mercado-pago/dto/callback.dto';
import { MercadoPagoCreateCheckoutDto } from '@modules/admin/modules/mercado-pago/dto/create-checkout.dto';
import { MercadoPagoPaymentHistoryFiltersDto } from '@modules/admin/modules/mercado-pago/dto/find-payments.dto';
import { MercadoPagoPaymentWebhookQueryDto } from '@modules/admin/modules/mercado-pago/dto/webhook.dto';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { ServiceRequestService } from '@modules/admin/modules/service-request/service-request.service';
import { SubscriptionService } from '@modules/admin/modules/subscription/subscription.service';
import { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';

// Coordina los cobros y la integración con Mercado Pago.
@Trace({ name: 'mercado-pago', type: 'service' })
@Injectable()
export class MercadoPagoService {
  private readonly hubsmeServicePaymentReferencePrefix = 'service-hubsme:';

  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(
    private readonly monnetCheckoutService: MonnetCheckoutService,
    private readonly meetingService: MeetingService,
    private readonly jwtService: JwtService,
    private readonly consultantAvailabilityService: ConsultantAvailabilityService,
    private readonly consultantService: ConsultantService,
    private readonly pymeService: PymeService,
    private readonly subscriptionService: SubscriptionService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly meetingConsultantPayoutService: MeetingConsultantPayoutService,
    private readonly consultantMercadoPagoAccountQuery: ConsultantMercadoPagoAccountQuery,
    private readonly checkoutQuery: CheckoutQuery,
    private readonly checkoutJoinQuery: CheckoutJoinQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
    private readonly pymeJoinQuery: PymeJoinQuery,
  ) {}

  async getAuthUrl(query: MercadoPagoAuthUrlDto) {
    await this.validateConsultant(query.consultantId);
    const { clientId, redirectUri } = this.getOAuthConfig();
    const state = this.jwtService.sign({ flow: 'consultant-mercado-pago', consultantId: query.consultantId } satisfies MercadoPagoState, { expiresIn: '10m' });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: redirectUri,
      state,
      scope: 'offline_access',
    });

    return { url: `https://auth.mercadopago.com/authorization?${params.toString()}` };
  }

  async handleCallback(query: MercadoPagoCallbackDto) {
    try {
      if (query.error) {
        return this.buildPopupResponse({ error: query.error });
      }

      if (!query.code || !query.state) {
        return this.buildPopupResponse({ error: 'Faltan parametros de autenticacion de Mercado Pago' });
      }

      const state = this.jwtService.verify<MercadoPagoState>(query.state);
      if (state.flow !== 'consultant-mercado-pago') {
        throw new UnauthorizedException('Flujo de Mercado Pago invalido');
      }

      await this.validateConsultant(state.consultantId);
      const token = await this.exchangeCode(query.code);
      const current = await this.consultantMercadoPagoAccountQuery.findByConsultantId(state.consultantId);
      const refreshToken = token.refresh_token ?? current?.refreshToken;

      if (!refreshToken) {
        throw new BadRequestException(['Mercado Pago no devolvio refresh token. Vuelve a conectar la cuenta.']);
      }

      const profile = await this.getMercadoPagoUser(token.access_token);
      const mercadoPagoUserId = this.stringifyId(profile.id ?? token.user_id);
      if (!mercadoPagoUserId) {
        throw new UnauthorizedException('No se pudo identificar la cuenta de Mercado Pago conectada');
      }

      await this.consultantMercadoPagoAccountQuery.upsertByConsultantId(state.consultantId, {
        consultantId: state.consultantId,
        mercadoPagoUserId,
        nickname: profile.nickname,
        email: profile.email?.trim().toLowerCase(),
        accessToken: token.access_token,
        refreshToken,
        tokenExpiresAt: this.getExpiresAt(token.expires_in),
        scope: token.scope,
        connectedAt: new Date(),
      });

      return this.buildPopupResponse({ connected: true, nickname: profile.nickname, email: profile.email });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo conectar Mercado Pago';
      return this.buildPopupResponse({ error: message });
    }
  }

  async getStatus(consultantId: number) {
    await this.validateConsultant(consultantId);
    const account = await this.consultantMercadoPagoAccountQuery.findByConsultantId(consultantId);

    return {
      connected: Boolean(account),
      mercadoPagoUserId: account?.mercadoPagoUserId ?? null,
      nickname: account?.nickname ?? null,
      email: account?.email ?? null,
      connectedAt: account?.connectedAt ?? null,
    };
  }

  async disconnect(consultantId: number) {
    await this.validateConsultant(consultantId);
    await this.consultantMercadoPagoAccountQuery.deleteByConsultantId(consultantId);
    return { connected: false, mercadoPagoUserId: null, nickname: null, email: null, connectedAt: null };
  }

  async createCheckout(currentUser: AuthenticatedUser, data: MercadoPagoCreateCheckoutDto) {
    return this.monnetCheckoutService.createCheckout(currentUser, data);
  }

  async findCheckout(currentUser: AuthenticatedUser, id: number) {
    return this.monnetCheckoutService.findCheckout(currentUser, id);
  }

  async findPayments(currentUser: AuthenticatedUser, filters: MercadoPagoPaymentHistoryFiltersDto) {
    const role = this.getPaymentHistoryRole(currentUser);
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 10);
    const year = filters.year ?? new Date().getFullYear();
    const month = filters.month ?? new Date().getMonth() + 1;
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));
    const result = await this.checkoutJoinQuery.findAllForUser({
      userId: this.participantId(currentUser),
      role,
      page,
      limit,
      from,
      to,
      operationType: filters.operationType,
      paymentType: filters.paymentType,
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

  async findPayment(currentUser: AuthenticatedUser, id: number) {
    const role = this.getPaymentHistoryRole(currentUser);
    const payment = await this.checkoutJoinQuery.findOneForUser(id, this.participantId(currentUser), role);
    if (!payment) {
      throw new NotFoundException(`Mercado Pago payment with ID ${id} not found`);
    }

    return payment;
  }

  async prepareCheckoutPayment(currentUser: AuthenticatedUser, id: number, data: MonnetPrepareCheckoutPaymentDto) {
    return this.monnetCheckoutService.prepareCheckoutPayment(currentUser, id, data);
  }

  async prepareServicePayment(currentUser: AuthenticatedUser, serviceRequestId: number, installmentIndex?: number) {
    this.assertPymeOwner(currentUser);
    const currentUserId = this.participantId(currentUser);
    const serviceRequest = await this.serviceRequestService.findPayableForPyme(serviceRequestId, currentUserId);
    const installment = installmentIndex === undefined ? serviceRequest.paymentSchedule.find((item) => item.status !== 'approved') : serviceRequest.paymentSchedule.find((item) => item.installmentIndex === installmentIndex);
    if (!installment) {
      throw new BadRequestException(['La cuota seleccionada no existe o ya fue pagada']);
    }
    if (installment.status === 'approved') {
      throw new BadRequestException(['La cuota seleccionada ya fue pagada']);
    }
    if (!installment.available) {
      throw new BadRequestException([installment.availabilityMessage ?? 'La siguiente cuota todavía no está disponible']);
    }
    const amount = Number(installment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(['No se pudo calcular el monto de la siguiente cuota']);
    }

    let checkout = await this.checkoutQuery.findByServiceRequestInstallment(serviceRequestId, installment.installmentIndex);
    if (checkout?.status === 'approved') {
      await this.markServicePaidAfterInitialInstallment(checkout);
      return checkout;
    }
    if (checkout && this.isHubsmeServicePayment(checkout) && checkout.preferenceId && (checkout.initPoint || checkout.sandboxInitPoint)) {
      if (serviceRequest.status !== 'paid') {
        await this.serviceRequestService.markPaymentPending(serviceRequestId);
      }
      return checkout;
    }

    const externalReference = this.buildHubsmeServicePaymentReference(serviceRequestId, installment.installmentIndex);
    if (!checkout) {
      checkout = await this.checkoutQuery.create({
        meetingId: null,
        serviceRequestId,
        serviceInstallmentIndex: installment.installmentIndex,
        pymeId: serviceRequest.pymeId,
        consultantId: serviceRequest.consultantId,
        preferenceId: null,
        initPoint: null,
        sandboxInitPoint: null,
        externalReference,
        status: 'created',
        collectionDestination: 'hubsme',
        amount: amount.toFixed(2),
        marketplaceFee: '0.00',
        currency: serviceRequest.currency,
      });
    } else {
      checkout = await this.checkoutQuery.update(checkout.id, {
        preferenceId: null,
        initPoint: null,
        sandboxInitPoint: null,
        externalReference,
        status: 'created',
        collectionDestination: 'hubsme',
        amount: amount.toFixed(2),
        marketplaceFee: '0.00',
        currency: serviceRequest.currency,
      });
    }

    const accessToken = this.getPlatformAccessToken();
    const preference = await this.createPreference(accessToken, {
      serviceRequestId,
      title: `${serviceRequest.title} · ${installment.label}`,
      amount,
      externalReference: checkout.externalReference,
    });
    const updatedCheckout = await this.checkoutQuery.update(checkout.id, {
      preferenceId: preference.id,
      initPoint: preference.init_point ?? null,
      sandboxInitPoint: preference.sandbox_init_point ?? null,
      marketplaceFee: '0.00',
    });
    if (serviceRequest.status !== 'paid') {
      await this.serviceRequestService.markPaymentPending(serviceRequestId);
    }
    return updatedCheckout;
  }

  async syncServicePayment(currentUser: AuthenticatedUser, serviceRequestId: number, installmentIndex?: number) {
    if (currentUser.role !== 'pyme') {
      throw new UnauthorizedException('Solo la PYME puede verificar el pago de un servicio');
    }

    await this.serviceRequestService.findOneForUser(serviceRequestId, currentUser);
    const checkout = installmentIndex === undefined ? await this.checkoutQuery.findByServiceRequestId(serviceRequestId) : await this.checkoutQuery.findByServiceRequestInstallment(serviceRequestId, installmentIndex);
    if (!checkout || !this.isHubsmeServicePayment(checkout)) {
      throw new NotFoundException(`No existe un pago de Mercado Pago para el servicio ${serviceRequestId}`);
    }

    if (checkout.status === 'approved') {
      await this.markServicePaidAfterInitialInstallment(checkout);
      return checkout;
    }

    const payment = await this.findPaymentByExternalReference(checkout.externalReference);
    if (!payment) return checkout;

    const status = this.mapPaymentStatus(payment.status);
    if (status !== 'approved') {
      return this.checkoutQuery.update(checkout.id, {
        mercadoPagoPaymentId: this.stringifyId(payment.id),
        status,
        rawPayment: payment,
      });
    }

    const approvedCheckout = await this.checkoutQuery.approveIfUnprocessed(checkout.id, {
      mercadoPagoPaymentId: this.stringifyId(payment.id),
      rawPayment: payment,
    });
    await this.markServicePaidAfterInitialInstallment(approvedCheckout ?? checkout);
    return approvedCheckout ?? (await this.checkoutQuery.findOne(checkout.id)) ?? checkout;
  }

  private getPaymentHistoryRole(currentUser: AuthenticatedUser): 'pyme' | 'consultor' {
    if (currentUser.role === 'pyme' || currentUser.role === 'consultor') {
      return currentUser.role;
    }

    throw new UnauthorizedException('Solo una PYME o un consultor puede consultar su historial de pagos');
  }

  private participantId(currentUser: AuthenticatedUser) {
    return currentUser.role === 'pyme' ? (currentUser.pymeId ?? currentUser.id) : currentUser.id;
  }

  private assertPymeOwner(currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'pyme' || currentUser.membershipRole !== 'owner') {
      throw new UnauthorizedException('Solo el propietario de la PYME puede iniciar pagos');
    }
  }

  async handleWebhook(query: MercadoPagoPaymentWebhookQueryDto = {}) {
    const paymentId = this.getPaymentIdFromWebhookQuery(query);
    const topic = (query.type ?? query.topic ?? this.getTopicFromWebhookAction(query.action))?.toLowerCase();
    const queryExternalReference = query.externalReference?.trim();

    if (!paymentId || topic !== 'payment') {
      return { received: true };
    }

    if (queryExternalReference?.startsWith('subscription:')) {
      const payment = await this.getPayment(paymentId);
      const extRef = payment.external_reference ?? queryExternalReference;
      const status = this.mapPaymentStatus(payment.status);

      if (status === 'approved') {
        const parts = extRef.split(':');
        const userId = Number(parts[1]);
        const planId = parts[2];
        await this.subscriptionService.activatePlan(userId, planId);
      }
      return { received: true };
    }

    const checkoutFromQuery = queryExternalReference ? await this.checkoutQuery.findByExternalReference(queryExternalReference) : undefined;
    const consultantToken = checkoutFromQuery?.collectionDestination === 'consultant' ? await this.getPaymentAccessTokenForCheckout(checkoutFromQuery.consultantId) : undefined;
    const payment = await this.getPayment(paymentId, consultantToken);
    const externalReference = payment.external_reference ?? queryExternalReference;
    if (!externalReference) {
      return { received: true };
    }

    const checkout = checkoutFromQuery ?? (await this.checkoutQuery.findByExternalReference(externalReference));
    if (!checkout || checkout.rawPayment?.provider === 'monnet') {
      return { received: true };
    }

    const status = this.mapPaymentStatus(payment.status);

    if (status !== 'approved') {
      await this.checkoutQuery.update(checkout.id, {
        mercadoPagoPaymentId: this.stringifyId(payment.id),
        status,
        rawPayment: payment,
      });
      return { received: true };
    }

    const approvedCheckout = await this.checkoutQuery.approveIfUnprocessed(checkout.id, {
      mercadoPagoPaymentId: this.stringifyId(payment.id),
      rawPayment: payment,
    });

    if (!approvedCheckout) {
      const persistedCheckout = (await this.checkoutQuery.findOne(checkout.id)) ?? checkout;
      if (persistedCheckout.status === 'approved') {
        if (persistedCheckout.serviceRequestId) {
          await this.markServicePaidAfterInitialInstallment(persistedCheckout);
        } else {
          await this.meetingConsultantPayoutService.ensurePendingFromCheckout(persistedCheckout);
        }
      }
      return { received: true };
    }

    try {
      if (approvedCheckout.serviceRequestId) {
        await this.markServicePaidAfterInitialInstallment(approvedCheckout);
        return { received: true };
      }

      let meetingId = approvedCheckout.meetingId;
      let payoutCheckout: Awaited<ReturnType<CheckoutQuery['findOne']>> = approvedCheckout;
      if (meetingId) {
        await this.meetingService.markPaidPendingConfirmation(meetingId);
      } else if (approvedCheckout.meetingDetails) {
        const proposedStartTimes = this.getCheckoutProposedStartTimes(approvedCheckout.meetingDetails);
        const newMeeting = await this.meetingService.create({
          pymeId: approvedCheckout.pymeId,
          consultantId: approvedCheckout.consultantId,
          proposedStartTimes,
          durationMinutes: approvedCheckout.meetingDetails.durationMinutes,
          title: approvedCheckout.meetingDetails.title,
          description: approvedCheckout.meetingDetails.description || undefined,
          requestedBy: 'pyme',
        });

        await this.meetingService.markPaidPendingConfirmation(newMeeting.id);

        payoutCheckout = await this.checkoutQuery.update(approvedCheckout.id, {
          meetingId: newMeeting.id,
        });
        meetingId = newMeeting.id;
      }

      if (meetingId) {
        await this.meetingConsultantPayoutService.ensurePendingFromCheckout(payoutCheckout);
        this.sendMeetingNotifications(meetingId, approvedCheckout).catch(() => undefined);
      }
    } catch (error) {
      this.logger.error(`No se pudo completar el pago de consultoría del checkout ${approvedCheckout.id}`, error instanceof Error ? error.stack : String(error));
      throw error;
    }

    return { received: true };
  }

  private async sendMeetingNotifications(meetingId: number, approvedCheckout: { consultantId: number; pymeId: number }) {
    try {
      const meeting = await this.meetingService.findOne(meetingId);
      if (!meeting) return;

      const consultant = await this.consultantJoinQuery.findOne(approvedCheckout.consultantId);
      const pyme = await this.pymeJoinQuery.findOne(approvedCheckout.pymeId);

      const consultantName = consultant?.fullName || 'Consultor';
      const pymeName = pyme?.name || 'PYME';

      const proposedStartTimes = meeting.proposedStartTimes?.length ? meeting.proposedStartTimes.map((value) => new Date(value)) : meeting.startTime ? [new Date(meeting.startTime)] : [];
      const durationMinutes = meeting.durationMinutes || 60;
      const title = meeting.title || 'Sesión de consultoría';

      // Disparar notificaciones en segundo plano sin esperar (fire-and-forget)
      this.consultantService.sendMeetingPendingConfirmationNotification(meetingId, approvedCheckout.consultantId, pymeName, title, proposedStartTimes, durationMinutes, meeting.description).catch(() => undefined);

      this.pymeService.sendMeetingPendingConfirmationNotification(approvedCheckout.pymeId, consultantName, title, proposedStartTimes, durationMinutes, meeting.description).catch(() => undefined);
    } catch {
      // Catch general para evitar fallas colaterales
    }
  }

  private async validateConsultant(consultantId: number): Promise<Awaited<ReturnType<ConsultantQuery['create']>>> {
    const consultant = await this.consultantJoinQuery.findByUserId(consultantId);
    if (!consultant) {
      throw new NotFoundException(`Consultant profile for user ID ${consultantId} not found`);
    }
    return consultant;
  }

  private async getValidAccessToken(account: Awaited<ReturnType<ConsultantMercadoPagoAccountQuery['findByConsultantId']>>) {
    const bufferMs = 2 * 60 * 1000;
    if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() - bufferMs > Date.now()) {
      return account.accessToken;
    }

    const token = await this.refreshAccessToken(account.refreshToken);
    const refreshToken = token.refresh_token ?? account.refreshToken;
    await this.consultantMercadoPagoAccountQuery.update(account.id, {
      accessToken: token.access_token,
      refreshToken,
      tokenExpiresAt: this.getExpiresAt(token.expires_in),
      scope: token.scope ?? account.scope,
    });
    return token.access_token;
  }

  private async exchangeCode(code: string): Promise<Required<Pick<MercadoPagoTokenResponse, 'access_token'>> & MercadoPagoTokenResponse> {
    const { clientId, clientSecret, redirectUri } = this.getOAuthConfig(true);
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = (await response.json()) as MercadoPagoTokenResponse;
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description ?? data.message ?? data.error ?? 'Mercado Pago rechazo el codigo');
    }

    return { ...data, access_token: data.access_token };
  }

  private async refreshAccessToken(refreshToken: string): Promise<Required<Pick<MercadoPagoTokenResponse, 'access_token'>> & MercadoPagoTokenResponse> {
    const { clientId, clientSecret } = this.getOAuthConfig(true);
    const response = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = (await response.json()) as MercadoPagoTokenResponse;
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description ?? data.message ?? data.error ?? 'Mercado Pago rechazo el refresh token');
    }

    return { ...data, access_token: data.access_token };
  }

  private async getMercadoPagoUser(accessToken: string): Promise<MercadoPagoUserResponse> {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = (await response.json()) as MercadoPagoUserResponse;
    if (!response.ok) {
      throw new UnauthorizedException(data.message ?? 'No se pudo obtener la cuenta de Mercado Pago');
    }

    return data;
  }

  private async createPreference(
    accessToken: string,
    data: {
      meetingId?: number;
      serviceRequestId?: number;
      title: string;
      amount: number;
      marketplaceFee?: number;
      externalReference: string;
    },
  ): Promise<Required<Pick<MercadoPagoPreferenceResponse, 'id'>> & MercadoPagoPreferenceResponse> {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: data.externalReference,
            title: data.title,
            quantity: 1,
            currency_id: this.getCurrency(),
            unit_price: data.amount,
          },
        ],
        ...(data.marketplaceFee && data.marketplaceFee > 0 ? { marketplace_fee: data.marketplaceFee } : {}),
        external_reference: data.externalReference,
        notification_url: this.getWebhookUrl(data.externalReference),
        metadata: {
          external_reference: data.externalReference,
          ...(data.meetingId ? { meeting_id: data.meetingId } : {}),
          ...(data.serviceRequestId ? { service_request_id: data.serviceRequestId } : {}),
        },
      }),
    });

    const preference = (await response.json()) as MercadoPagoPreferenceResponse;
    if (!response.ok || !preference.id) {
      throw new BadRequestException([preference.message ?? preference.error ?? 'No se pudo crear el checkout de Mercado Pago']);
    }

    return { ...preference, id: preference.id };
  }

  private async getPayment(paymentId: string, consultantAccessToken?: string): Promise<MercadoPagoPaymentResponse> {
    const platformAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const accessTokens = [consultantAccessToken, platformAccessToken].filter((token, index, tokens): token is string => Boolean(token) && tokens.indexOf(token) === index);

    if (!accessTokens.length) {
      throw new BadRequestException(['Configura MERCADO_PAGO_ACCESS_TOKEN para procesar webhooks']);
    }

    let lastMessage = 'No se pudo consultar el pago en Mercado Pago';
    for (const accessToken of accessTokens) {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const payment = (await response.json()) as MercadoPagoPaymentResponse;
      if (response.ok) {
        return payment;
      }

      lastMessage = typeof payment.message === 'string' ? payment.message : lastMessage;
    }

    throw new BadRequestException([lastMessage]);
  }

  private async findPaymentByExternalReference(externalReference: string) {
    const params = new URLSearchParams({
      sort: 'date_created',
      criteria: 'desc',
      external_reference: externalReference,
    });
    const response = await fetch(`https://api.mercadopago.com/v1/payments/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${this.getPlatformAccessToken()}` },
    });
    const result = (await response.json()) as MercadoPagoPaymentSearchResponse;
    if (!response.ok) {
      throw new BadRequestException([result.message ?? result.error ?? 'No se pudo verificar el pago en Mercado Pago']);
    }

    const matchingPayments = (result.results ?? []).filter((payment) => payment.external_reference === externalReference);
    return matchingPayments.find((payment) => payment.status === 'approved') ?? matchingPayments[0];
  }

  private mapPaymentStatus(status?: string): 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' {
    if (status === 'approved') return 'approved';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'expired') return 'expired';
    if (['rejected', 'refunded', 'charged_back'].includes(status ?? '')) return 'rejected';
    return 'pending';
  }

  private buildExternalReference(meetingId: number) {
    return `meeting:${meetingId}`;
  }

  private normalizeProposedStartTimes(values: string[]) {
    const normalized = values.map((value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestException(['Uno de los horarios seleccionados no es valido']);
      }
      return date.toISOString();
    });
    const uniqueValues = [...new Set(normalized)].sort();
    if (uniqueValues.length !== 3) {
      throw new BadRequestException(['Selecciona exactamente 3 horarios distintos']);
    }
    return uniqueValues;
  }

  private getCheckoutProposedStartTimes(meetingDetails: MeetingDetails) {
    if (meetingDetails.proposedStartTimes?.length) {
      return this.normalizeProposedStartTimes(meetingDetails.proposedStartTimes);
    }
    return this.normalizeProposedStartTimes([meetingDetails.startTime]);
  }

  private getExpiresAt(expiresIn?: number) {
    return new Date(Date.now() + (expiresIn ?? 21600) * 1000);
  }

  private stringifyId(value?: number | string) {
    if (value === undefined || value === null) return undefined;
    return String(value);
  }

  private getPaymentIdFromWebhookQuery(query: MercadoPagoPaymentWebhookQueryDto) {
    if (query['data.id']) return query['data.id'];
    if (query.id) return query.id;
    if (query.payment_id) return query.payment_id;
    if (!query.resource) return undefined;

    const match = query.resource.match(/\/payments\/([^/?#]+)/);
    return match?.[1];
  }

  private getTopicFromWebhookAction(action?: string) {
    return action?.split('.')[0];
  }

  private getCurrency() {
    return process.env.MERCADO_PAGO_CURRENCY ?? 'PEN';
  }

  private getPlatformAccessToken() {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      throw new BadRequestException(['MERCADO_PAGO_ACCESS_TOKEN no configurado']);
    }
    return accessToken;
  }

  private buildHubsmeServicePaymentReference(serviceRequestId: number, installmentIndex: number) {
    return `${this.hubsmeServicePaymentReferencePrefix}${serviceRequestId}:${installmentIndex}:${Date.now()}`;
  }

  private async markServicePaidAfterInitialInstallment(checkout: { serviceRequestId: number | null; serviceInstallmentIndex: number | null }) {
    if (checkout.serviceRequestId && checkout.serviceInstallmentIndex === 0) {
      await this.serviceRequestService.markPaid(checkout.serviceRequestId);
    }
  }

  private isHubsmeServicePayment(checkout: { serviceRequestId?: number | null; externalReference: string }) {
    return Boolean(checkout.serviceRequestId) && checkout.externalReference.startsWith(this.hubsmeServicePaymentReferencePrefix);
  }

  private getWebhookUrl(externalReference?: string) {
    const explicit = process.env.MERCADO_PAGO_WEBHOOK_URL;
    const baseUrl = explicit || this.getDefaultWebhookUrl();
    if (!baseUrl || !externalReference) return baseUrl;

    try {
      const url = new URL(baseUrl);
      url.searchParams.set('externalReference', externalReference);
      return url.toString();
    } catch {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}externalReference=${encodeURIComponent(externalReference)}`;
    }
  }

  private getDefaultWebhookUrl() {
    const backendUrl = process.env.BACKEND_URL;
    return backendUrl ? `${backendUrl.replace(/\/$/, '')}/admin/mercado-pago/webhook` : undefined;
  }

  private async getPaymentAccessTokenForCheckout(consultantId: number) {
    const account = await this.consultantMercadoPagoAccountQuery.findByConsultantId(consultantId);
    return account ? this.getValidAccessToken(account) : undefined;
  }

  private getOAuthConfig(requireSecret = false) {
    const clientId = process.env.MERCADO_PAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADO_PAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADO_PAGO_REDIRECT_URI;

    if (!clientId || !redirectUri || (requireSecret && !clientSecret)) {
      throw new BadRequestException(['Mercado Pago OAuth no esta configurado en el backend']);
    }

    return { clientId, clientSecret: clientSecret ?? '', redirectUri };
  }

  private buildPopupResponse(data: { connected?: boolean; nickname?: string; email?: string; error?: string }) {
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.WEB_URL ?? '*';
    const payload = JSON.stringify({ type: 'hubsme:mercado-pago', ...data });
    const targetOrigin = this.getTargetOrigin(frontendUrl);

    return `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><title>Mercado Pago</title></head>
  <body>
    <script>
      window.opener && window.opener.postMessage(${payload}, ${JSON.stringify(targetOrigin)});
      window.close();
    </script>
  </body>
</html>`;
  }

  private getTargetOrigin(frontendUrl: string) {
    if (frontendUrl === '*') return '*';

    try {
      return new URL(frontendUrl).origin;
    } catch {
      return '*';
    }
  }
}
