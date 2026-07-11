import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Consultant } from '@db/tables/consultant.table';
import { ConsultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { MercadoPagoPaymentRaw } from '@db/tables/mercado-pago-payment.table';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';
import { MeetingService } from '../meeting/meeting.service';
import { ConsultantAvailabilityService } from '../consultant-availability/consultant-availability.service';
import { ConsultantService } from '../consultant/consultant.service';
import { PymeService } from '../pyme/pyme.service';
import { MercadoPagoAuthUrlDto, MercadoPagoCallbackDto } from './dto/mercado-pago-auth.dto';

import { SubscriptionService } from '../subscription/subscription.service';
import { MercadoPagoCreateCheckoutDto, MercadoPagoPaymentWebhookQueryDto } from './dto/mercado-pago-checkout.dto';

type MercadoPagoState = {
  flow: 'consultant-mercado-pago';
  consultantId: number;
};

type MercadoPagoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number | string;
  error?: string;
  message?: string;
  error_description?: string;
};

type MercadoPagoUserResponse = {
  id?: number | string;
  nickname?: string;
  email?: string;
  message?: string;
};

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
};

type MercadoPagoPaymentResponse = MercadoPagoPaymentRaw & {
  id?: number | string;
  status?: string;
  external_reference?: string;
};

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(
    private readonly accountRepository: ConsultantMercadoPagoAccountRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly pymeRepository: PymeRepository,
    private readonly paymentRepository: MercadoPagoPaymentRepository,
    private readonly meetingService: MeetingService,
    private readonly jwtService: JwtService,
    private readonly consultantAvailabilityService: ConsultantAvailabilityService,
    private readonly consultantService: ConsultantService,
    private readonly pymeService: PymeService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async getAuthUrl(query: MercadoPagoAuthUrlDto) {
    await this.validateConsultant(query.consultantId);
    const { clientId, redirectUri } = this.getOAuthConfig();
    const state = this.jwtService.sign(
      { flow: 'consultant-mercado-pago', consultantId: query.consultantId } satisfies MercadoPagoState,
      { expiresIn: '10m' },
    );

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
      const current = await this.accountRepository.findByConsultantId(state.consultantId);
      const refreshToken = token.refresh_token ?? current?.refreshToken;

      if (!refreshToken) {
        throw new BadRequestException(['Mercado Pago no devolvio refresh token. Vuelve a conectar la cuenta.']);
      }

      const profile = await this.getMercadoPagoUser(token.access_token);
      const mercadoPagoUserId = this.stringifyId(profile.id ?? token.user_id);
      if (!mercadoPagoUserId) {
        throw new UnauthorizedException('No se pudo identificar la cuenta de Mercado Pago conectada');
      }

      await this.accountRepository.upsertByConsultantId(state.consultantId, {
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
    const account = await this.accountRepository.findByConsultantId(consultantId);

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
    await this.accountRepository.deleteByConsultantId(consultantId);
    return { connected: false, mercadoPagoUserId: null, nickname: null, email: null, connectedAt: null };
  }

  async createCheckout(currentUserId: number, data: MercadoPagoCreateCheckoutDto) {
    const pymeId = currentUserId;
    const durationMinutes = data.durationMinutes ?? 60;

    if (durationMinutes < 60) {
      throw new BadRequestException(['La duración mínima de la sesión es de 60 minutos (1 hora)']);
    }

    await this.consultantAvailabilityService.assertAvailableForMeeting(
      data.consultantId,
      new Date(data.startTime),
      durationMinutes,
    );

    const consultant = await this.validateConsultant(data.consultantId);
    const amount = this.calculateAmount(consultant, durationMinutes);
    const marketplaceFee = this.calculateMarketplaceFee(amount);

    const tempRef = `pending:${pymeId}:${data.consultantId}:${Date.now()}`;

    return this.paymentRepository.create({
      meetingId: null,
      pymeId,
      consultantId: data.consultantId,
      preferenceId: null,
      initPoint: null,
      sandboxInitPoint: null,
      externalReference: tempRef,
      status: 'created',
      amount: amount.toFixed(2),
      marketplaceFee: marketplaceFee.toFixed(2),
      currency: this.getCurrency(),
      meetingDetails: {
        startTime: data.startTime,
        durationMinutes,
        title: data.title,
        description: data.description || undefined,
      },
    });
  }

  async findCheckout(currentUserId: number, id: number) {
    const checkout = await this.paymentRepository.findOne(id);
    if (!checkout) {
      throw new NotFoundException(`Mercado Pago checkout with ID ${id} not found`);
    }

    if (![checkout.pymeId, checkout.consultantId].includes(currentUserId)) {
      throw new UnauthorizedException('No tienes acceso a este checkout');
    }

    return checkout;
  }

  async prepareCheckoutPayment(currentUserId: number, id: number) {
    const checkout = await this.findCheckout(currentUserId, id);

    if (checkout.pymeId !== currentUserId) {
      throw new UnauthorizedException('Solo la PYME puede iniciar el pago de este checkout');
    }
    if (checkout.status === 'approved' || checkout.meetingId) {
      throw new BadRequestException(['Este checkout ya fue pagado']);
    }
    if (checkout.preferenceId && (checkout.initPoint || checkout.sandboxInitPoint)) {
      return checkout;
    }
    if (!checkout.meetingDetails) {
      throw new BadRequestException(['El checkout no contiene los datos de la reunión']);
    }

    const account = await this.accountRepository.findByConsultantId(checkout.consultantId);
    if (!account) {
      throw new BadRequestException(['El consultor aun no conecto su cuenta de Mercado Pago']);
    }

    const accessToken = await this.getValidAccessToken(account);
    const preference = await this.createPreference(accessToken, {
      title: checkout.meetingDetails.title,
      amount: Number(checkout.amount),
      marketplaceFee: Number(checkout.marketplaceFee),
      externalReference: checkout.externalReference,
    });

    return this.paymentRepository.update(checkout.id, {
      preferenceId: preference.id,
      initPoint: preference.init_point ?? null,
      sandboxInitPoint: preference.sandbox_init_point ?? null,
    });
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

    const checkoutFromQuery = queryExternalReference
      ? await this.paymentRepository.findByExternalReference(queryExternalReference)
      : undefined;
    const consultantToken = checkoutFromQuery
      ? await this.getPaymentAccessTokenForCheckout(checkoutFromQuery.consultantId)
      : undefined;
    const payment = await this.getPayment(paymentId, consultantToken);
    const externalReference = payment.external_reference ?? queryExternalReference;
    if (!externalReference) {
      return { received: true };
    }

    const checkout = checkoutFromQuery ?? (await this.paymentRepository.findByExternalReference(externalReference));
    if (!checkout) {
      return { received: true };
    }

    const status = this.mapPaymentStatus(payment.status);

    if (status !== 'approved') {
      await this.paymentRepository.update(checkout.id, {
        mercadoPagoPaymentId: this.stringifyId(payment.id),
        status,
        rawPayment: payment,
      });
      return { received: true };
    }

    const approvedCheckout = await this.paymentRepository.approveIfUnprocessed(checkout.id, {
      mercadoPagoPaymentId: this.stringifyId(payment.id),
      rawPayment: payment,
    });

    if (!approvedCheckout) {
      return { received: true };
    }

    try {
      let meetingId = approvedCheckout.meetingId;
      if (meetingId) {
        await this.meetingService.confirm(meetingId);
      } else if (approvedCheckout.meetingDetails) {
        const newMeeting = await this.meetingService.create({
          pymeId: approvedCheckout.pymeId,
          consultantId: approvedCheckout.consultantId,
          startTime: new Date(approvedCheckout.meetingDetails.startTime),
          durationMinutes: approvedCheckout.meetingDetails.durationMinutes,
          title: approvedCheckout.meetingDetails.title,
          description: approvedCheckout.meetingDetails.description || undefined,
          requestedBy: 'pyme',
        });

        await this.meetingService.confirm(newMeeting.id);

        await this.paymentRepository.update(approvedCheckout.id, {
          meetingId: newMeeting.id,
        });
        meetingId = newMeeting.id;
      }

      if (meetingId) {
        this.sendMeetingNotifications(meetingId, approvedCheckout).catch(() => undefined);
      }
    } catch (error) {
      // Ignorar errores silenciosamente
    }

    return { received: true };
  }

  private async sendMeetingNotifications(meetingId: number, approvedCheckout: any) {
    try {
      const meeting = await this.meetingService.findOne(meetingId);
      if (!meeting) return;

      const consultant = await this.consultantRepository.findOne(approvedCheckout.consultantId);
      const pyme = await this.pymeRepository.findOne(approvedCheckout.pymeId);

      const consultantName = consultant?.fullName || 'Consultor';
      const pymeName = pyme?.name || 'PYME';

      const startTime = meeting.startTime ? new Date(meeting.startTime) : new Date();
      const durationMinutes = meeting.durationMinutes || 60;
      const title = meeting.title || 'Sesión de consultoría';

      // Disparar notificaciones en segundo plano sin esperar (fire-and-forget)
      this.consultantService
        .sendMeetingNotification(approvedCheckout.consultantId, pymeName, title, startTime, durationMinutes)
        .catch(() => undefined);

      this.pymeService
        .sendMeetingNotification(approvedCheckout.pymeId, consultantName, title, startTime, durationMinutes)
        .catch(() => undefined);
    } catch {
      // Catch general para evitar fallas colaterales
    }
  }

  private async validateConsultant(consultantId: number): Promise<Consultant> {
    const consultant = await this.consultantRepository.findByUserId(consultantId);
    if (!consultant) {
      throw new NotFoundException(`Consultant profile for user ID ${consultantId} not found`);
    }
    return consultant;
  }

  private async getValidAccessToken(account: ConsultantMercadoPagoAccount) {
    const bufferMs = 2 * 60 * 1000;
    if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() - bufferMs > Date.now()) {
      return account.accessToken;
    }

    const token = await this.refreshAccessToken(account.refreshToken);
    const refreshToken = token.refresh_token ?? account.refreshToken;
    await this.accountRepository.update(account.id, {
      accessToken: token.access_token,
      refreshToken,
      tokenExpiresAt: this.getExpiresAt(token.expires_in),
      scope: token.scope ?? account.scope,
    });
    return token.access_token;
  }

  private async exchangeCode(
    code: string,
  ): Promise<Required<Pick<MercadoPagoTokenResponse, 'access_token'>> & MercadoPagoTokenResponse> {
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
      throw new UnauthorizedException(
        data.error_description ?? data.message ?? data.error ?? 'Mercado Pago rechazo el codigo',
      );
    }

    return { ...data, access_token: data.access_token };
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<Required<Pick<MercadoPagoTokenResponse, 'access_token'>> & MercadoPagoTokenResponse> {
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
      throw new UnauthorizedException(
        data.error_description ?? data.message ?? data.error ?? 'Mercado Pago rechazo el refresh token',
      );
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
    data: { meetingId?: number; title: string; amount: number; marketplaceFee: number; externalReference: string },
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
        marketplace_fee: data.marketplaceFee,
        external_reference: data.externalReference,
        notification_url: this.getWebhookUrl(data.externalReference),
        metadata: {
          external_reference: data.externalReference,
          ...(data.meetingId ? { meeting_id: data.meetingId } : {}),
        },
      }),
    });

    const preference = (await response.json()) as MercadoPagoPreferenceResponse;
    if (!response.ok || !preference.id) {
      throw new BadRequestException([
        preference.message ?? preference.error ?? 'No se pudo crear el checkout de Mercado Pago',
      ]);
    }

    return { ...preference, id: preference.id };
  }

  private async getPayment(paymentId: string, consultantAccessToken?: string): Promise<MercadoPagoPaymentResponse> {
    const platformAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const accessTokens = [consultantAccessToken, platformAccessToken].filter(
      (token, index, tokens): token is string => Boolean(token) && tokens.indexOf(token) === index,
    );

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

  private calculateAmount(consultant: Consultant, durationMinutes: number) {
    const pricePerHour = Number(consultant.pricePerHour ?? 0);
    const amount = pricePerHour * (durationMinutes / 60);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(['El consultor no tiene una tarifa valida para cobrar']);
    }

    return Number(amount.toFixed(2));
  }

  private calculateMarketplaceFee(amount: number) {
    const rawPercent = Number(process.env.MERCADO_PAGO_PLATFORM_FEE_PERCENT ?? 0);
    const fee = (amount * (Number.isFinite(rawPercent) ? rawPercent : 0)) / 100;
    return Number(Math.max(0, fee).toFixed(2));
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
    const account = await this.accountRepository.findByConsultantId(consultantId);
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
