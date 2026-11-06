import { Trace } from '@erixcel/traceflow';
import type {
  GoogleCalendarEvent,
  GoogleCalendarEventDate,
  GoogleCalendarEventsResponse,
  GoogleCalendarState,
  GoogleCalendarTokenResponse,
  GoogleUserInfo,
} from '@modules/admin/modules/consultant-google-calendar/types/consultant-google-calendar.type';
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConsultantGoogleCalendarQuery } from '@queries/consultant-google-calendar/consultant-google-calendar.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';

import {
  ConsultantGoogleCalendarAuthUrlDto,
  ConsultantGoogleCalendarBusyItemDto,
} from '@modules/admin/modules/consultant-google-calendar/dto/auth-url.dto';
import { ConsultantGoogleCalendarBusyMonthDto } from '@modules/admin/modules/consultant-google-calendar/dto/busy-month.dto';
import { ConsultantGoogleCalendarCallbackDto } from '@modules/admin/modules/consultant-google-calendar/dto/callback.dto';

// Coordina la integración con Google Calendar.
@Trace({ name: 'consultant-google-calendar', type: 'service' })
@Injectable()
export class ConsultantGoogleCalendarService {
  private readonly calendarScope = 'https://www.googleapis.com/auth/calendar.readonly';

  constructor(
    private readonly jwtService: JwtService,
    private readonly consultantGoogleCalendarQuery: ConsultantGoogleCalendarQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
  ) {}

  async getAuthUrl(query: ConsultantGoogleCalendarAuthUrlDto) {
    await this.validateConsultant(query.consultantId);
    const { clientId, redirectUri } = this.getGoogleCalendarConfig();
    const state = this.jwtService.sign(
      { flow: 'consultant-calendar', consultantId: query.consultantId } satisfies GoogleCalendarState,
      { expiresIn: '10m' },
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: `openid email profile ${this.calendarScope}`,
      prompt: 'consent select_account',
      access_type: 'offline',
      include_granted_scopes: 'true',
      state,
    });

    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  }

  async handleCallback(query: ConsultantGoogleCalendarCallbackDto) {
    try {
      if (query.error) {
        return this.buildPopupResponse({ error: query.error });
      }

      if (!query.code || !query.state) {
        return this.buildPopupResponse({ error: 'Faltan parametros de autenticacion de Google Calendar' });
      }

      const state = this.jwtService.verify<GoogleCalendarState>(query.state);
      if (state.flow !== 'consultant-calendar') {
        throw new UnauthorizedException('Flujo de Google Calendar invalido');
      }

      await this.validateConsultant(state.consultantId);
      const token = await this.exchangeCode(query.code);
      const current = await this.consultantGoogleCalendarQuery.findByConsultantId(state.consultantId);
      const refreshToken = token.refresh_token ?? current?.refreshToken;

      if (!refreshToken) {
        throw new BadRequestException([
          'Google no devolvio refresh token. Revoca el acceso en Google y vuelve a conectar la cuenta.',
        ]);
      }

      const profile = await this.getGoogleUserInfo(token.access_token);
      const googleEmail = profile.email?.trim().toLowerCase();
      if (!googleEmail || profile.email_verified === false) {
        throw new UnauthorizedException('Google no verifico el correo de esta cuenta');
      }

      await this.consultantGoogleCalendarQuery.upsertByConsultantId(state.consultantId, {
        consultantId: state.consultantId,
        googleEmail,
        googleCalendarId: 'primary',
        accessToken: token.access_token,
        refreshToken,
        tokenExpiresAt: this.getExpiresAt(token.expires_in),
        scope: token.scope,
        connectedAt: new Date(),
      });

      return this.buildPopupResponse({ connected: true, googleEmail });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo conectar Google Calendar';
      return this.buildPopupResponse({ error: message });
    }
  }

  async getStatus(consultantId: number) {
    await this.validateConsultant(consultantId);
    const account = await this.consultantGoogleCalendarQuery.findByConsultantId(consultantId);

    return {
      connected: Boolean(account),
      googleEmail: account?.googleEmail ?? null,
      googleCalendarId: account?.googleCalendarId ?? null,
      connectedAt: account?.connectedAt ?? null,
    };
  }

  async disconnect(consultantId: number) {
    await this.validateConsultant(consultantId);
    await this.consultantGoogleCalendarQuery.deleteByConsultantId(consultantId);
    return { connected: false, googleEmail: null, googleCalendarId: null, connectedAt: null };
  }

  async findBusyMonth(query: ConsultantGoogleCalendarBusyMonthDto) {
    await this.validateConsultant(query.consultantId);
    const account = await this.consultantGoogleCalendarQuery.findByConsultantId(query.consultantId);
    if (!account) return { data: [] };

    const accessToken = await this.getValidAccessToken(account);
    const { startFrom, startTo } = this.getMonthRange(query.year, query.month);
    const params = new URLSearchParams({
      timeMin: startFrom.toISOString(),
      timeMax: startTo.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const calendarId = encodeURIComponent(account.googleCalendarId);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const data = (await response.json()) as GoogleCalendarEventsResponse;

    if (!response.ok) {
      throw new BadRequestException([data.error?.message ?? 'No se pudo obtener el calendario de Google']);
    }

    return {
      data: (data.items ?? [])
        .filter((event) => event.status !== 'cancelled' && event.transparency !== 'transparent')
        .map((event) => this.toBusyItem(event))
        .filter((event): event is ConsultantGoogleCalendarBusyItemDto => event !== null),
    };
  }

  private async validateConsultant(consultantId: number) {
    const consultant = await this.consultantJoinQuery.findByUserId(consultantId);
    if (!consultant) {
      throw new NotFoundException(`Consultant profile for user ID ${consultantId} not found`);
    }
  }

  private async getValidAccessToken(account: Awaited<ReturnType<ConsultantGoogleCalendarQuery['findByConsultantId']>>) {
    const bufferMs = 2 * 60 * 1000;
    if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() - bufferMs > Date.now()) {
      return account.accessToken;
    }

    const token = await this.refreshAccessToken(account.refreshToken);
    await this.consultantGoogleCalendarQuery.update(account.id, {
      accessToken: token.access_token,
      tokenExpiresAt: this.getExpiresAt(token.expires_in),
      scope: token.scope ?? account.scope,
    });
    return token.access_token;
  }

  private async exchangeCode(
    code: string,
  ): Promise<Required<Pick<GoogleCalendarTokenResponse, 'access_token'>> & GoogleCalendarTokenResponse> {
    const { clientId, clientSecret, redirectUri } = this.getGoogleCalendarConfig(true);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const data = (await response.json()) as GoogleCalendarTokenResponse;
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description ?? data.error ?? 'Google rechazo el codigo de Calendar');
    }

    return { ...data, access_token: data.access_token };
  }

  private async refreshAccessToken(
    refreshToken: string,
  ): Promise<Required<Pick<GoogleCalendarTokenResponse, 'access_token'>> & GoogleCalendarTokenResponse> {
    const { clientId, clientSecret } = this.getGoogleCalendarConfig(true);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    const data = (await response.json()) as GoogleCalendarTokenResponse;
    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(data.error_description ?? data.error ?? 'Google rechazo el refresh token');
    }

    return { ...data, access_token: data.access_token };
  }

  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('No se pudo obtener el perfil de Google');
    }

    return (await response.json()) as GoogleUserInfo;
  }

  private toBusyItem(event: GoogleCalendarEvent): ConsultantGoogleCalendarBusyItemDto | null {
    const startTime = this.parseGoogleDate(event.start);
    const endTime = this.parseGoogleDate(event.end);
    if (!event.id || !startTime || !endTime || endTime <= startTime) return null;

    return {
      id: event.id,
      summary: event.summary ?? null,
      startTime,
      endTime,
      source: 'google-calendar',
    };
  }

  private parseGoogleDate(value?: GoogleCalendarEventDate) {
    const raw = value?.dateTime ?? (value?.date ? `${value.date}T00:00:00.000Z` : undefined);
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getExpiresAt(expiresIn?: number) {
    return new Date(Date.now() + (expiresIn ?? 3600) * 1000);
  }

  private getMonthRange(year: number, month: number) {
    const startFrom = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const startTo = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    return { startFrom, startTo };
  }

  private getGoogleCalendarConfig(requireSecret = false) {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

    if (!clientId || !redirectUri || (requireSecret && !clientSecret)) {
      throw new BadRequestException(['Google Calendar OAuth no esta configurado en el backend']);
    }

    return { clientId, clientSecret: clientSecret ?? '', redirectUri };
  }

  private buildPopupResponse(data: { connected?: boolean; googleEmail?: string; error?: string }) {
    const frontendUrl = process.env.FRONTEND_URL ?? process.env.WEB_URL ?? '*';
    const payload = JSON.stringify({ type: 'hubsme:google-calendar', ...data });
    const targetOrigin = this.getTargetOrigin(frontendUrl);

    return `<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><title>Google Calendar</title></head>
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
