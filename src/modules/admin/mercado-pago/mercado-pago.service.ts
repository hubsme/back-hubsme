import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Consultant } from '@db/tables/consultant.table';
import { ConsultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { MercadoPagoPaymentRaw } from '@db/tables/mercado-pago-payment.table';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';
import { MeetingService } from '../meeting/meeting.service';
import { ConsultantAvailabilityService } from '../consultant-availability/consultant-availability.service';
import { MercadoPagoAuthUrlDto, MercadoPagoCallbackDto } from './dto/mercado-pago-auth.dto';
import { MercadoPagoCreateCheckoutDto, MercadoPagoPaymentWebhookDto } from './dto/mercado-pago-checkout.dto';

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
    private readonly paymentRepository: MercadoPagoPaymentRepository,
    private readonly meetingService: MeetingService,
    private readonly jwtService: JwtService,
    private readonly consultantAvailabilityService: ConsultantAvailabilityService,
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

    await this.consultantAvailabilityService.assertAvailableForMeeting(
      data.consultantId,
      new Date(data.startTime),
      durationMinutes,
    );

    const consultant = await this.validateConsultant(data.consultantId);
    const account = await this.accountRepository.findByConsultantId(data.consultantId);
    if (!account) {
      throw new BadRequestException(['El consultor aun no conecto su cuenta de Mercado Pago']);
    }

    const accessToken = await this.getValidAccessToken(account);
    const amount = this.calculateAmount(consultant, durationMinutes);
    const marketplaceFee = this.calculateMarketplaceFee(amount);

    const tempRef = `pending:${pymeId}:${data.consultantId}:${Date.now()}`;

    const preference = await this.createPreference(accessToken, {
      title: data.title,
      amount,
      marketplaceFee,
      externalReference: tempRef,
    });

    return this.paymentRepository.create({
      meetingId: null,
      pymeId,
      consultantId: data.consultantId,
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
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

  async handleWebhook(body: MercadoPagoPaymentWebhookDto) {
    const paymentId = body.data?.id ?? body.id;
    const topic = body.type ?? body.topic;

    if (!paymentId || topic !== 'payment') {
      return { received: true };
    }

    const payment = await this.getPayment(paymentId);
    const externalReference = payment.external_reference;
    if (!externalReference) {
      return { received: true };
    }

    const checkout = await this.paymentRepository.findByExternalReference(externalReference);
    if (!checkout) {
      return { received: true };
    }

    const status = this.mapPaymentStatus(payment.status);

    if (checkout.status === 'approved') {
      return { received: true };
    }

    await this.paymentRepository.update(checkout.id, {
      mercadoPagoPaymentId: this.stringifyId(payment.id),
      status,
      rawPayment: payment,
    });

    if (status === 'approved') {
      try {
        if (checkout.meetingId) {
          await this.meetingService.confirm(checkout.meetingId);
        } else if (checkout.meetingDetails) {
          const newMeeting = await this.meetingService.create({
            pymeId: checkout.pymeId,
            consultantId: checkout.consultantId,
            startTime: new Date(checkout.meetingDetails.startTime),
            durationMinutes: checkout.meetingDetails.durationMinutes,
            title: checkout.meetingDetails.title,
            description: checkout.meetingDetails.description || undefined,
            requestedBy: 'pyme',
          });

          await this.meetingService.confirm(newMeeting.id);

          await this.paymentRepository.update(checkout.id, {
            meetingId: newMeeting.id,
          });
        }
      } catch (error) {
        this.logger.error(`No se pudo confirmar o crear la reunion para el checkout ${checkout.id}: ${String(error)}`);
      }
    }

    return { received: true };
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
    data: { meetingId?: number; title: string; amount: number; marketplaceFee: number; externalReference: string },
  ): Promise<Required<Pick<MercadoPagoPreferenceResponse, 'id'>> & MercadoPagoPreferenceResponse> {
    const backUrls = this.getBackUrls(data.meetingId);
    const isHttps = backUrls.success?.startsWith('https://');

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
        notification_url: this.getWebhookUrl(),
        back_urls: backUrls,
        ...(isHttps ? { auto_return: 'approved' } : {}),
        metadata: {
          external_reference: data.externalReference,
          ...(data.meetingId ? { meeting_id: data.meetingId } : {}),
        },
      }),
    });

    const preference = (await response.json()) as MercadoPagoPreferenceResponse;
    if (!response.ok || !preference.id) {
      throw new BadRequestException([preference.message ?? preference.error ?? 'No se pudo crear el checkout de Mercado Pago']);
    }

    return { ...preference, id: preference.id };
  }

  private async getPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new BadRequestException(['Configura MERCADO_PAGO_ACCESS_TOKEN para procesar webhooks']);
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payment = (await response.json()) as MercadoPagoPaymentResponse;
    if (!response.ok) {
      throw new BadRequestException(['No se pudo consultar el pago en Mercado Pago']);
    }

    return payment;
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
    const fee = amount * (Number.isFinite(rawPercent) ? rawPercent : 0) / 100;
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

  private getCurrency() {
    return process.env.MERCADO_PAGO_CURRENCY ?? 'PEN';
  }

  private getWebhookUrl() {
    const explicit = process.env.MERCADO_PAGO_WEBHOOK_URL;
    if (explicit) return explicit;

    const backendUrl = process.env.BACKEND_URL;
    return backendUrl ? `${backendUrl.replace(/\/$/, '')}/admin/mercado-pago/webhook` : undefined;
  }

  private getBackUrls(meetingId?: number) {
    const frontendUrl = (process.env.FRONTEND_URL ?? process.env.WEB_URL ?? 'http://localhost:6200').replace(/\/$/, '');
    return {
      success: process.env.MERCADO_PAGO_SUCCESS_URL ?? (meetingId ? `${frontendUrl}/pyme/meetings/${meetingId}?payment=success` : `${frontendUrl}/pyme/meetings?payment=success`),
      failure: process.env.MERCADO_PAGO_FAILURE_URL ?? (meetingId ? `${frontendUrl}/pyme/meetings/${meetingId}?payment=failure` : `${frontendUrl}/pyme/meetings?payment=failure`),
      pending: process.env.MERCADO_PAGO_PENDING_URL ?? (meetingId ? `${frontendUrl}/pyme/meetings/${meetingId}?payment=pending` : `${frontendUrl}/pyme/meetings?payment=pending`),
    };
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
