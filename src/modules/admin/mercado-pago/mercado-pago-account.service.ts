import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConsultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import {
  ConsultantMercadoPagoAdminDto,
  ConsultantMercadoPagoFinancialAdminDto,
  MercadoPagoFinancialReportDto,
  MercadoPagoAccountProfileDto,
} from '../consultant/dto/consultant-mercado-pago.dto';

type MercadoPagoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  message?: string;
  error_description?: string;
};

type MercadoPagoUserResponse = {
  id?: number | string;
  nickname?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  site_id?: string;
  country_id?: string;
  user_type?: string;
  permalink?: string;
  registration_date?: string;
  date_created?: string;
  message?: string;
};

type AccessTokenResult = {
  accessToken: string;
  tokenExpiresAt: Date | null;
};

type MercadoPagoReportRecord = Record<string, unknown>;

export type MercadoPagoFinancialDownloadResult =
  | {
      kind: 'file';
      buffer: Buffer;
      contentType: string;
      fileName: string;
    }
  | {
      kind: 'processing';
      taskId: string | null;
      message: string;
    };

@Injectable()
export class MercadoPagoAccountService {
  private readonly logger = new Logger(MercadoPagoAccountService.name);

  constructor(private readonly accountRepository: ConsultantMercadoPagoAccountRepository) {}

  async findAdminDetails(consultantId: number): Promise<ConsultantMercadoPagoAdminDto> {
    const account = await this.accountRepository.findByConsultantId(consultantId);
    const baseDetails = this.buildBaseDetails(account);

    if (!account) return baseDetails;

    const profileLastCheckedAt = new Date();
    try {
      const { accessToken, tokenExpiresAt } = await this.getValidAccessToken(account);
      const profile = await this.getMercadoPagoUser(accessToken);

      return {
        ...baseDetails,
        tokenExpiresAt,
        profileLastCheckedAt,
        accountProfile: this.mapProfile(profile, account),
        profileError: null,
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo actualizar el perfil de Mercado Pago del consultor ${consultantId}: ${this.getErrorMessage(error)}`,
      );

      return {
        ...baseDetails,
        profileLastCheckedAt,
        profileError: 'No se pudo actualizar la información de Mercado Pago. Revisa la conexión OAuth.',
      };
    }
  }

  private buildBaseDetails(account: ConsultantMercadoPagoAccount | undefined): ConsultantMercadoPagoAdminDto {
    return {
      connected: Boolean(account),
      mercadoPagoUserId: account?.mercadoPagoUserId ?? null,
      nickname: account?.nickname ?? null,
      email: account?.email ?? null,
      connectedAt: account?.connectedAt ?? null,
      lastUpdatedAt: account?.updatedAt ?? null,
      accountProfile: null,
      tokenExpiresAt: account?.tokenExpiresAt ?? null,
      profileLastCheckedAt: null,
      profileError: null,
    };
  }

  async getValidAccessToken(account: ConsultantMercadoPagoAccount): Promise<AccessTokenResult> {
    const bufferMs = 2 * 60 * 1000;
    if (account.accessToken && account.tokenExpiresAt && account.tokenExpiresAt.getTime() - bufferMs > Date.now()) {
      return { accessToken: account.accessToken, tokenExpiresAt: account.tokenExpiresAt };
    }

    const token = await this.refreshAccessToken(account.refreshToken);
    const refreshToken = token.refresh_token ?? account.refreshToken;
    const tokenExpiresAt = this.getExpiresAt(token.expires_in);
    await this.accountRepository.update(account.id, {
      accessToken: token.access_token,
      refreshToken,
      tokenExpiresAt,
      scope: token.scope ?? account.scope,
    });

    return { accessToken: token.access_token, tokenExpiresAt };
  }

  async findFinancialDetails(consultantId: number): Promise<ConsultantMercadoPagoFinancialAdminDto> {
    const account = await this.accountRepository.findByConsultantId(consultantId);
    if (!account) {
      return {
        connected: false,
        status: 'not_available',
        currency: null,
        balanceAvailable: false,
        reportCount: 0,
        latestReport: null,
        lastUpdatedAt: null,
        message: 'El consultor todavía no ha conectado una cuenta de Mercado Pago.',
      };
    }

    try {
      const { accessToken } = await this.getValidAccessToken(account);
      const reports = await this.getSettlementReports(accessToken, consultantId);
      const latestReport = this.mapLatestReport(reports);

      return {
        connected: true,
        status: latestReport ? 'available' : 'not_available',
        currency: 'PEN',
        balanceAvailable: false,
        reportCount: reports.length,
        latestReport,
        lastUpdatedAt: new Date(),
        message: latestReport
          ? 'Se encontró el último reporte financiero disponible. El saldo se obtiene al descargar y procesar ese reporte.'
          : 'Mercado Pago todavía no tiene reportes financieros disponibles para esta cuenta.',
      };
    } catch (error) {
      this.logger.warn(
        `No se pudo consultar el estado financiero de Mercado Pago del consultor ${consultantId}: ${this.getErrorMessage(error)}`,
      );

      return {
        connected: true,
        status: 'error',
        currency: 'PEN',
        balanceAvailable: false,
        reportCount: 0,
        latestReport: null,
        lastUpdatedAt: new Date(),
        message: 'No se pudo consultar el estado financiero. Verifica los permisos y la conexión OAuth.',
      };
    }
  }

  async downloadLatestFinancialReport(
    consultantId: number,
    taskId?: string,
  ): Promise<MercadoPagoFinancialDownloadResult> {
    const account = await this.accountRepository.findByConsultantId(consultantId);
    if (!account) {
      throw new BadRequestException('El consultor todavía no ha conectado una cuenta de Mercado Pago.');
    }

    try {
      const { accessToken } = await this.getValidAccessToken(account);

      if (taskId) {
        const trackedResult = await this.continueSettlementReportTask(accessToken, consultantId, taskId);
        if (trackedResult) return trackedResult;

        this.logger.warn(
          `[MercadoPago] La tarea taskId=${taskId} ya no existe para consultantId=${consultantId}; buscando otro reporte disponible`,
        );
      }

      const reports = await this.getSettlementReports(accessToken, consultantId);
      const report = this.findLatestProcessedReport(reports);
      const pendingReport = this.findLatestPendingReport(reports);

      if (pendingReport && (!report || this.reportTimestamp(pendingReport) > this.reportTimestamp(report))) {
        const pendingTaskId = this.readString(pendingReport.id) ?? this.readString(pendingReport.report_id) ?? null;
        if (pendingTaskId) {
          const trackedResult = await this.continueSettlementReportTask(accessToken, consultantId, pendingTaskId);
          if (trackedResult) return trackedResult;
        }

        return {
          kind: 'processing',
          taskId: pendingTaskId,
          message: 'Mercado Pago todavía está generando el reporte. Intenta descargarlo nuevamente en unos minutos.',
        };
      }

      if (!report) {
        return this.requestSettlementReport(accessToken, consultantId);
      }

      const fileName = await this.resolveReportFileName(accessToken, report, consultantId);
      if (!fileName) {
        return {
          kind: 'processing',
          taskId: this.readString(report.id) ?? this.readString(report.report_id) ?? null,
          message:
            'Mercado Pago procesó el reporte, pero el archivo todavía no está disponible. Intenta nuevamente en unos minutos.',
        };
      }

      return this.downloadSettlementReportFile(accessToken, consultantId, fileName);
    } catch (error) {
      this.logger.warn(
        `No se pudo descargar el reporte financiero de Mercado Pago del consultor ${consultantId}: ${this.getErrorMessage(error)}`,
      );

      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('No se pudo descargar el reporte financiero de Mercado Pago.');
    }
  }

  private async continueSettlementReportTask(
    accessToken: string,
    consultantId: number,
    taskId: string,
  ): Promise<MercadoPagoFinancialDownloadResult | null> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/account/settlement_report/task/${encodeURIComponent(taskId)}`,
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const payload = await this.readResponsePayload(
      response,
      `consultar tarea consultantId=${consultantId} taskId=${taskId}`,
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new BadRequestException(this.readRemoteMessage(payload));
    if (!this.isRecord(payload)) {
      throw new BadRequestException('Mercado Pago devolvió una tarea financiera inválida.');
    }

    const status = this.readString(payload.status)?.toLowerCase();

    if (status === 'failed' || status === 'error' || status === 'cancelled') {
      this.logger.warn(
        `[MercadoPago] La tarea taskId=${taskId} terminó con status=${status}; se solicitará un reporte nuevo`,
      );
      return null;
    }

    if (status !== 'processed') {
      return {
        kind: 'processing',
        taskId,
        message: 'Mercado Pago todavía está generando el reporte. El seguimiento continuará automáticamente.',
      };
    }

    const fileName = this.readString(payload.file_name);
    if (!fileName) {
      return {
        kind: 'processing',
        taskId,
        message: 'Mercado Pago procesó el reporte, pero el archivo todavía no está disponible.',
      };
    }

    return this.downloadSettlementReportFile(accessToken, consultantId, fileName);
  }

  private async downloadSettlementReportFile(
    accessToken: string,
    consultantId: number,
    fileName: string,
  ): Promise<MercadoPagoFinancialDownloadResult> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/account/settlement_report/${encodeURIComponent(fileName)}`,
      {
        headers: {
          Accept: 'text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const payload = await this.readResponsePayload(response, `descargar archivo consultantId=${consultantId}`);
      throw new BadRequestException(this.readRemoteMessage(payload));
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      throw new BadRequestException('Mercado Pago devolvió el reporte sin contenido. Intenta nuevamente más tarde.');
    }

    return {
      kind: 'file',
      buffer,
      contentType: response.headers.get('content-type') ?? 'text/csv',
      fileName,
    };
  }

  private async getSettlementReports(accessToken: string, consultantId: number): Promise<MercadoPagoReportRecord[]> {
    const response = await fetch('https://api.mercadopago.com/v1/account/settlement_report/list', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const payload = await this.readResponsePayload(response, `listar reportes consultantId=${consultantId}`);

    if (!response.ok) {
      throw new BadRequestException(this.readRemoteMessage(payload));
    }

    const reports = this.readReports(payload);
    return reports;
  }

  private findLatestProcessedReport(reports: MercadoPagoReportRecord[]) {
    return [...reports]
      .filter((report) => this.readString(report.status)?.toLowerCase() === 'processed')
      .sort((left, right) => this.reportTimestamp(right) - this.reportTimestamp(left))[0];
  }

  private async resolveReportFileName(
    accessToken: string,
    report: MercadoPagoReportRecord,
    consultantId: number,
  ): Promise<string | undefined> {
    const directFileName = this.readString(report.file_name);
    if (directFileName) return directFileName;

    const taskId = this.readString(report.id);
    if (taskId) {
      const taskResponse = await fetch(
        `https://api.mercadopago.com/v1/account/settlement_report/task/${encodeURIComponent(taskId)}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      const taskPayload = await this.readResponsePayload(
        taskResponse,
        `consultar tarea consultantId=${consultantId} taskId=${taskId}`,
      );

      if (taskResponse.ok && this.isRecord(taskPayload)) {
        const taskFileName = this.readString(taskPayload.file_name);
        if (taskFileName) return taskFileName;
      }
    }

    const reportId = this.readString(report.report_id);
    if (!reportId) return undefined;

    const beginDate = this.readString(report.begin_date);
    const endDate = this.readString(report.end_date);
    if (!beginDate) {
      this.logger.warn(
        `[MercadoPago] No se puede buscar el archivo consultantId=${consultantId} reportId=${reportId}: el listado no devolvió begin_date`,
      );
      return undefined;
    }

    const query = new URLSearchParams({ id: reportId, begin_date: beginDate, limit: '1' });
    if (endDate) query.set('end_date', endDate);

    const searchResponse = await fetch(`https://api.mercadopago.com/v1/account/settlement_report/search?${query}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const searchPayload = await this.readResponsePayload(
      searchResponse,
      `buscar reporte consultantId=${consultantId} reportId=${reportId}`,
    );

    if (!searchResponse.ok) {
      throw new BadRequestException(this.readRemoteMessage(searchPayload));
    }

    return this.readString(this.readReports(searchPayload)[0]?.file_name);
  }

  private findLatestPendingReport(reports: MercadoPagoReportRecord[]) {
    return [...reports]
      .filter((report) => {
        const status = this.readString(report.status)?.toLowerCase();
        return status === 'pending' || status === 'processing' || status === 'in_progress';
      })
      .sort((left, right) => this.reportTimestamp(right) - this.reportTimestamp(left))[0];
  }

  private async requestSettlementReport(
    accessToken: string,
    consultantId: number,
  ): Promise<MercadoPagoFinancialDownloadResult> {
    const now = new Date();
    const beginDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    const beginDateValue = this.toMercadoPagoUtcDate(beginDate);
    const endDateValue = this.toMercadoPagoUtcDate(now);
    const requestBody = {
      begin_date: beginDateValue,
      end_date: endDateValue,
    };
    const endpoint = 'https://api.mercadopago.com/v1/account/settlement_report';
    const sendRequest = (url: string) =>
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });

    let response = await sendRequest(endpoint);
    let payload = await this.readResponsePayload(
      response,
      `generar reporte por body consultantId=${consultantId} beginDate=${beginDateValue} endDate=${endDateValue}`,
    );

    if (!response.ok && this.readRemoteMessage(payload).toLowerCase().includes('begin_date')) {
      const query = new URLSearchParams(requestBody);
      this.logger.warn(
        `[MercadoPago] El endpoint no reconoció begin_date en el body para consultantId=${consultantId}; reintentando con parámetros de compatibilidad`,
      );
      response = await sendRequest(`${endpoint}?${query}`);
      payload = await this.readResponsePayload(
        response,
        `generar reporte por query consultantId=${consultantId} beginDate=${beginDateValue} endDate=${endDateValue}`,
      );
    }

    if (!response.ok) {
      throw new BadRequestException(this.readRemoteMessage(payload));
    }

    return {
      kind: 'processing',
      taskId: this.isRecord(payload)
        ? (this.readString(payload.id) ?? this.readString(payload.report_id) ?? null)
        : null,
      message: 'Mercado Pago está generando el reporte. Intenta descargarlo nuevamente en unos minutos.',
    };
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

    const payload = await this.readResponsePayload(response, 'renovar token OAuth');
    const data = this.isRecord(payload) ? (payload as MercadoPagoTokenResponse) : {};
    if (!response.ok || !data.access_token) {
      throw new BadRequestException(
        data.error_description ?? data.message ?? data.error ?? 'Mercado Pago rechazo el refresh token',
      );
    }

    return { ...data, access_token: data.access_token };
  }

  private async getMercadoPagoUser(accessToken: string): Promise<MercadoPagoUserResponse> {
    const response = await fetch('https://api.mercadopago.com/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = await this.readResponsePayload(response, 'consultar perfil autorizado');
    const data = this.isRecord(payload) ? (payload as MercadoPagoUserResponse) : {};
    if (!response.ok) {
      throw new BadRequestException(data.message ?? 'No se pudo obtener la cuenta de Mercado Pago');
    }

    return data;
  }

  private mapProfile(
    profile: MercadoPagoUserResponse,
    account: ConsultantMercadoPagoAccount,
  ): MercadoPagoAccountProfileDto {
    return {
      id: profile.id !== undefined ? String(profile.id) : account.mercadoPagoUserId,
      nickname: profile.nickname ?? account.nickname ?? null,
      email: profile.email ?? account.email ?? null,
      firstName: profile.first_name ?? null,
      lastName: profile.last_name ?? null,
      siteId: profile.site_id ?? null,
      countryId: profile.country_id ?? null,
      userType: profile.user_type ?? null,
      permalink: profile.permalink ?? null,
      registrationDate: this.parseDate(profile.registration_date),
      dateCreated: this.parseDate(profile.date_created),
    };
  }

  private parseDate(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private readReports(payload: unknown): MercadoPagoReportRecord[] {
    if (Array.isArray(payload)) {
      return payload.filter((item): item is MercadoPagoReportRecord => this.isRecord(item));
    }

    if (this.isRecord(payload) && Array.isArray(payload.reports)) {
      return payload.reports.filter((item): item is MercadoPagoReportRecord => this.isRecord(item));
    }

    if (this.isRecord(payload) && Array.isArray(payload.results)) {
      return payload.results.filter((item): item is MercadoPagoReportRecord => this.isRecord(item));
    }

    return [];
  }

  private mapLatestReport(reports: MercadoPagoReportRecord[]): MercadoPagoFinancialReportDto | null {
    const sortedReports = [...reports].sort((left, right) => {
      return this.reportTimestamp(right) - this.reportTimestamp(left);
    });
    const report = sortedReports[0];
    if (!report) return null;

    return {
      id: this.readString(report.id) ?? this.readString(report.report_id),
      beginDate: this.parseDate(this.readString(report.begin_date)),
      endDate: this.parseDate(this.readString(report.end_date)),
      fileName: this.readString(report.file_name),
      createdAt: this.parseDate(this.readString(report.date_created) ?? this.readString(report.generation_date)),
    };
  }

  private reportTimestamp(report: MercadoPagoReportRecord) {
    return (
      this.parseDate(this.readString(report.date_created) ?? this.readString(report.generation_date))?.getTime() ?? 0
    );
  }

  private toMercadoPagoUtcDate(date: Date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private async readResponsePayload(response: Response, context: string): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';
    const body = await response.text();
    const bodyLength = Buffer.byteLength(body, 'utf8');

    if (!body.trim()) {
      this.logger.warn(`[MercadoPago] ${context} devolvió un cuerpo vacío`);
      return null;
    }

    if (contentType.toLowerCase().includes('json')) {
      try {
        return JSON.parse(body) as unknown;
      } catch (error) {
        this.logger.error(
          `[MercadoPago] ${context} devolvió JSON inválido bytes=${bodyLength}: ${this.getErrorMessage(error)}`,
        );
        return { message: 'Mercado Pago devolvió una respuesta JSON inválida.' };
      }
    }

    return body;
  }

  private readRemoteMessage(payload: unknown) {
    if (!this.isRecord(payload)) return 'Mercado Pago rechazó la consulta financiera';
    return (
      this.readString(payload.message) ??
      this.readString(payload.error) ??
      'Mercado Pago rechazó la consulta financiera'
    );
  }

  private readString(value: unknown) {
    return typeof value === 'string' ? value : value === null || value === undefined ? undefined : String(value);
  }

  private isRecord(value: unknown): value is MercadoPagoReportRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getExpiresAt(expiresIn?: number) {
    return typeof expiresIn === 'number' ? new Date(Date.now() + expiresIn * 1000) : null;
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

  private getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'error desconocido';
  }
}
