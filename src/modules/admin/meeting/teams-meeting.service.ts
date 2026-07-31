import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { AiService } from '../ai/ai.service';
import { HubsmeAiResultDto } from '../ai/dto/hubsme-ai/hubsme-ai-result.dto';
import {
  GraphCalendar,
  GraphCalendarEvent,
  GraphCallRecording,
  GraphCallTranscript,
  GraphDriveItem,
  GraphListResponse,
  GraphOnlineMeeting,
  GraphSharingPermission,
  MeetingRecording,
} from './teams-meeting.interface';

@Injectable()
export class TeamsMeetingService {
  private readonly logger = new Logger(TeamsMeetingService.name);
  private appGraphClient?: Client;
  private clientSecretCredential?: ClientSecretCredential;

  constructor(private readonly aiService: AiService) {}

  isTeamsMeetingCreationEnabled(): boolean {
    return process.env.TEAMS_MEETINGS_ENABLED === 'true';
  }

  private ensureGraphForAppOnlyAuth(): void {
    if (!this.clientSecretCredential) {
      this.clientSecretCredential = new ClientSecretCredential(
        process.env.MS_GRAPH_TENANT_ID!,
        process.env.MS_GRAPH_CLIENT_ID!,
        process.env.MS_GRAPH_CLIENT_SECRET!,
      );
    }

    if (!this.appGraphClient) {
      const authProvider = new TokenCredentialAuthenticationProvider(this.clientSecretCredential, {
        scopes: ['https://graph.microsoft.com/.default'],
      });

      this.appGraphClient = Client.initWithMiddleware({
        authProvider,
      });
    }
  }

  async createOnlineMeeting(data: {
    title: string;
    startTime: Date;
    durationMinutes: number;
  }): Promise<{ id: string; joinWebUrl: string }> {
    this.assertGraphConfig();
    this.ensureGraphForAppOnlyAuth();

    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;

    const startDateTime = data.startTime.toISOString();
    const endDateTime = new Date(data.startTime.getTime() + data.durationMinutes * 60_000).toISOString();

    const eventPayload = {
      subject: data.title,
      start: {
        dateTime: startDateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'UTC',
      },
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
    };

    try {
      await this.assertTeamsCalendarProvider(organizerUserId!);

      const calendarEvent = (await this.appGraphClient!.api(`/users/${organizerUserId}/calendar/events`).post(
        eventPayload,
      )) as GraphCalendarEvent;

      const joinWebUrl = await this.resolveCalendarEventJoinUrl(organizerUserId!, calendarEvent);
      const onlineMeeting = await this.findOnlineMeetingByJoinWebUrl(joinWebUrl);

      if (!onlineMeeting?.id || !onlineMeeting.joinWebUrl) {
        throw new Error('No se pudo resolver el onlineMeeting asociado al evento de calendario.');
      }

      await this.updateOnlineMeetingSettings(onlineMeeting.id);

      this.logger.log(`Reunión calendar-backed creada y configurada con grabación automática: ${data.title}`);

      return { id: onlineMeeting.id, joinWebUrl: onlineMeeting.joinWebUrl };
    } catch (error: unknown) {
      const graphError = this.getGraphErrorDetails(error);
      this.logger.error(`Microsoft Graph calendar-backed Teams meeting creation failed: ${graphError}`);
      throw new InternalServerErrorException(`No se pudo crear la reunión de Microsoft Teams (${graphError})`);
    }
  }

  private async assertTeamsCalendarProvider(organizerUserId: string): Promise<void> {
    const calendar = (await this.appGraphClient!.api(`/users/${organizerUserId}/calendar`)
      .select('id,allowedOnlineMeetingProviders,defaultOnlineMeetingProvider')
      .get()) as GraphCalendar;
    const allowedProviders = calendar.allowedOnlineMeetingProviders ?? [];

    if (!allowedProviders.includes('teamsForBusiness')) {
      throw new Error(
        'El calendario del organizador no tiene Teams habilitado como proveedor de reuniones. ' +
          `Proveedores permitidos: ${allowedProviders.join(', ') || 'ninguno'}.`,
      );
    }
  }

  private async resolveCalendarEventJoinUrl(
    organizerUserId: string,
    calendarEvent: GraphCalendarEvent,
  ): Promise<string> {
    if (calendarEvent.onlineMeeting?.joinUrl) {
      return calendarEvent.onlineMeeting.joinUrl;
    }

    if (!calendarEvent.id) {
      throw new Error('El evento de calendario no devolvió id ni joinUrl.');
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await this.sleep(500);
      const event = (await this.appGraphClient!.api(`/users/${organizerUserId}/calendar/events/${calendarEvent.id}`)
        .select('id,onlineMeeting')
        .get()) as GraphCalendarEvent;

      if (event.onlineMeeting?.joinUrl) {
        return event.onlineMeeting.joinUrl;
      }
    }

    throw new Error('El evento de calendario no generó un enlace de Teams.');
  }

  private async updateOnlineMeetingSettings(onlineMeetingId: string): Promise<void> {
    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;

    await this.appGraphClient!.api(`/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}`).patch({
      recordAutomatically: true,
      meetingSpokenLanguageTag: 'es-ES',
      allowedPresenters: 'everyone',
      lobbyBypassSettings: {
        scope: 'everyone',
      },
    });
  }

  private async findOnlineMeetingByJoinWebUrl(meetingUrl: string): Promise<GraphOnlineMeeting | null> {
    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;
    const response = (await this.appGraphClient!.api(`/users/${organizerUserId}/onlineMeetings`)
      .filter(`joinWebUrl eq '${this.escapeODataString(meetingUrl)}'`)
      .get()) as GraphListResponse<GraphOnlineMeeting>;

    const onlineMeetings = response.value ?? [];
    return onlineMeetings[0] ?? null;
  }

  async resolveOnlineMeetingByJoinWebUrl(meetingUrl: string): Promise<GraphOnlineMeeting | null> {
    this.assertGraphConfig();
    this.ensureGraphForAppOnlyAuth();

    return this.findOnlineMeetingByJoinWebUrl(meetingUrl);
  }

  async listOnlineMeetingRecordings(onlineMeetingId: string): Promise<MeetingRecording[]> {
    this.assertGraphConfig();
    this.ensureGraphForAppOnlyAuth();

    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;
    const response = (await this.appGraphClient!.api(
      `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/recordings`,
    ).get()) as GraphListResponse<GraphCallRecording>;

    const recordings = response.value ?? [];
    if (!recordings.length) return [];

    const driveItems = await this.listOrganizerRecordingFiles();
    return Promise.all(recordings.map((recording) => this.toMeetingRecording(recording, driveItems)));
  }

  private async listOrganizerRecordingFiles(): Promise<GraphDriveItem[]> {
    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;

    try {
      const response = (await this.appGraphClient!.api(`/users/${organizerUserId}/drive/root:/Recordings:/children`)
        .top(999)
        .get()) as GraphListResponse<GraphDriveItem>;

      return response.value ?? [];
    } catch (error: unknown) {
      this.logger.warn(`No se pudo listar la carpeta Recordings de OneDrive: ${this.getErrorMessage(error)}`);
      return [];
    }
  }

  private async toMeetingRecording(
    recording: GraphCallRecording,
    driveItems: GraphDriveItem[],
  ): Promise<MeetingRecording> {
    const driveItem = this.findDriveItemForRecording(recording, driveItems);
    if (!driveItem) {
      return {
        ...recording,
        driveId: null,
        driveItemId: null,
        fileName: null,
        webUrl: null,
        publicUrl: null,
        downloadUrl: null,
      };
    }

    const driveId = driveItem.parentReference?.driveId ?? null;
    const driveItemId = driveItem.id ?? null;

    return {
      ...recording,
      driveId,
      driveItemId,
      fileName: driveItem.name ?? null,
      webUrl: driveItem.webUrl ?? null,
      publicUrl: await this.createAnonymousRecordingLink(driveId, driveItemId),
      downloadUrl: driveItem['@microsoft.graph.downloadUrl'] ?? null,
    };
  }

  private findDriveItemForRecording(
    recording: GraphCallRecording,
    driveItems: GraphDriveItem[],
  ): GraphDriveItem | null {
    const recordingTimestamp =
      this.extractRecordingTimestamp(recording.contentCorrelationId) ??
      this.formatRecordingTimestamp(recording.createdDateTime);

    if (recordingTimestamp) {
      const timestampMatch = driveItems.find((item) => item.name?.includes(recordingTimestamp));
      if (timestampMatch) return timestampMatch;
    }

    const recordingDate = this.parseDate(recording.createdDateTime);
    if (!recordingDate) return null;

    const candidates = driveItems
      .map((item) => ({
        item,
        diff: Math.abs(
          (this.parseDate(item.createdDateTime)?.getTime() ??
            this.parseDate(item.lastModifiedDateTime)?.getTime() ??
            Number.NaN) - recordingDate.getTime(),
        ),
      }))
      .filter((candidate) => Number.isFinite(candidate.diff))
      .sort((left, right) => left.diff - right.diff);

    const closest = candidates[0];
    const twentyMinutes = 20 * 60 * 1000;
    return closest && closest.diff <= twentyMinutes ? closest.item : null;
  }

  private async createAnonymousRecordingLink(
    driveId: string | null,
    driveItemId: string | null,
  ): Promise<string | null> {
    if (!driveId || !driveItemId) return null;

    try {
      const permission = (await this.appGraphClient!.api(`/drives/${driveId}/items/${driveItemId}/createLink`).post({
        type: 'view',
        scope: 'anonymous',
      })) as GraphSharingPermission;

      return permission.link?.webUrl ?? null;
    } catch (error: unknown) {
      this.logger.warn(
        `No se pudo crear link publico para la grabacion ${driveItemId}: ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private extractRecordingTimestamp(value?: string): string | null {
    if (!value) return null;
    return value.match(/\d{8}_\d{6}/)?.[0] ?? null;
  }

  private formatRecordingTimestamp(value?: string): string | null {
    const date = this.parseDate(value);
    if (!date) return null;

    const pad = (part: number) => part.toString().padStart(2, '0');
    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
      '_',
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds()),
    ].join('');
  }

  private parseDate(value?: string): Date | null {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private getGraphErrorDetails(error: unknown): string {
    if (!error || typeof error !== 'object') return String(error);

    const graphError = error as {
      message?: unknown;
      statusCode?: unknown;
      code?: unknown;
      body?: unknown;
      response?: {
        statusCode?: unknown;
        body?: unknown;
        headers?: Record<string, unknown>;
      };
    };

    const details = {
      message: graphError.message,
      code: graphError.code,
      statusCode: graphError.statusCode ?? graphError.response?.statusCode,
      body: graphError.body ?? graphError.response?.body,
      requestId: graphError.response?.headers?.['request-id'] ?? graphError.response?.headers?.['client-request-id'],
    };

    try {
      return JSON.stringify(details);
    } catch {
      return this.getErrorMessage(error);
    }
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async getOnlineMeetingAiInsights(onlineMeetingId: string): Promise<HubsmeAiResultDto> {
    this.assertGraphConfig();
    this.ensureGraphForAppOnlyAuth();

    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;

    let transcripts: GraphCallTranscript[] = [];
    try {
      let transcriptRequestUrl = `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/transcripts`;
      while (transcriptRequestUrl) {
        const transcriptsResponse = (await this.appGraphClient!.api(
          transcriptRequestUrl,
        ).get()) as GraphListResponse<GraphCallTranscript>;
        transcripts.push(...(transcriptsResponse.value ?? []));
        transcriptRequestUrl = transcriptsResponse['@odata.nextLink'] ?? '';
      }

      transcripts = transcripts
        .filter((transcript): transcript is GraphCallTranscript & { id: string } => Boolean(transcript.id))
        .sort((left, right) => {
          const leftTime = left.createdDateTime ? new Date(left.createdDateTime).getTime() : 0;
          const rightTime = right.createdDateTime ? new Date(right.createdDateTime).getTime() : 0;
          return leftTime - rightTime;
        });
    } catch (error: unknown) {
      this.logger.warn(`Error al listar transcripciones desde Graph API: ${this.getErrorMessage(error)}`);
    }

    const transcriptParts: string[] = [];
    for (const [index, transcript] of transcripts.entries()) {
      try {
        const transcriptContent = (await this.appGraphClient!.api(
          `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/transcripts/${transcript.id}/content`,
        )
          .query({ $format: 'text/vtt' })
          .responseType(ResponseType.TEXT)
          .get()) as string;
        const cleanedTranscript = this.cleanTranscript(transcriptContent);

        if (cleanedTranscript) {
          transcriptParts.push(`## Transcripción ${transcriptParts.length + 1}\n${cleanedTranscript}`);
        }
      } catch (error: unknown) {
        this.logger.warn(
          `No se pudo leer la transcripción ${index + 1}; se continuará con las demás: ${this.getErrorMessage(error)}`,
        );
      }
    }

    const cleanedText = transcriptParts.join('\n\n---\n\n');
    if (!cleanedText) {
      throw new BadRequestException([
        'No se encontró ninguna transcripción disponible para esta reunión de Teams. Asegúrate de haber iniciado y guardado la grabación y transcripción.',
      ]);
    }

    // Fusionar todas las transcripciones disponibles antes de invocar el flujo de IA.
    return this.aiService.runHubsmeAiPrompt(cleanedText);
  }

  private cleanTranscript(vttText: string): string {
    if (!vttText) return '';

    const lines = vttText.split(/\r?\n/);
    const cleanLines: string[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.startsWith('WEBVTT') || line.startsWith('NOTE ')) continue;
      if (line.includes('-->')) continue;
      // Excluir líneas que son solo números (índices de subtítulos)
      if (/^\d+$/.test(line)) continue;

      // Limpiar etiquetas de orador: <v Nombre>Texto</v> -> Nombre: Texto
      let cleaned = line.replace(/<v ([^>]+)>/g, '$1: ').replace(/<\/v>/g, '');
      // Remover cualquier otra etiqueta HTML/VTT restante
      cleaned = cleaned.replace(/<[^>]*>/g, '').trim();

      if (cleaned) {
        cleanLines.push(cleaned);
      }
    }

    return cleanLines.join('\n');
  }

  private assertGraphConfig(): void {
    const required = [
      'MS_GRAPH_TENANT_ID',
      'MS_GRAPH_CLIENT_ID',
      'MS_GRAPH_CLIENT_SECRET',
      'MS_GRAPH_TEAMS_ORGANIZER_USER_ID',
    ];
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length) {
      this.logger.warn(`Missing Microsoft Graph env vars: ${missing.join(', ')}`);
      throw new BadRequestException([`Faltan variables de Microsoft Graph: ${missing.join(', ')}`]);
    }
  }
}
