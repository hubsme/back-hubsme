import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { AiService } from '../ai/ai.service';
import { HubsmeAiResultDto } from '../ai/dto/hubsme-ai/hubsme-ai-result.dto';
import {
  GraphCallRecording,
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

    const meetingPayload = {
      subject: data.title,
      startDateTime,
      endDateTime,
      lobbyBypassSettings: {
        scope: 'everyone',
      },
      recordAutomatically: true,
      allowedPresenters: 'everyone',
    };

    try {
      const onlineMeeting = (await this.appGraphClient!.api(`/users/${organizerUserId}/onlineMeetings`).post(
        meetingPayload,
      )) as GraphOnlineMeeting;

      if (!onlineMeeting.id || !onlineMeeting.joinWebUrl) {
        throw new Error('La creación de la reunión de Teams no devolvió ID o joinWebUrl.');
      }

      this.logger.log(`Reunión virtual pura de Teams creada con grabación automática y bypass de lobby restrictivo: ${data.title}`);

      return { id: onlineMeeting.id, joinWebUrl: onlineMeeting.joinWebUrl };
    } catch (error: any) {
      const graphError = error.message || JSON.stringify(error);
      this.logger.error(`Microsoft Graph onlineMeetings creation failed: ${graphError}`);
      throw new InternalServerErrorException(`No se pudo crear la reunión de Microsoft Teams (${graphError})`);
    }
  }

  private async findOnlineMeetingByJoinWebUrl(meetingUrl: string): Promise<GraphOnlineMeeting | null> {
    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;
    const response = (await this.appGraphClient!.api(`/users/${organizerUserId}/onlineMeetings`)
      .filter(`joinWebUrl eq '${this.escapeODataString(meetingUrl)}'`)
      .get()) as GraphListResponse<GraphOnlineMeeting>;

    return response.value?.[0] ?? null;
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
      const response = (await this.appGraphClient!.api(
        `/users/${organizerUserId}/drive/root:/Recordings:/children`,
      )
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
      this.logger.warn(`No se pudo crear link publico para la grabacion ${driveItemId}: ${this.getErrorMessage(error)}`);
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

    let transcriptContent = '';
    try {
      // 1. Listar transcripciones
      const transcriptsResponse = (await this.appGraphClient!.api(
        `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/transcripts`,
      ).get()) as GraphListResponse<{ id: string }>;

      const transcripts = transcriptsResponse.value ?? [];
      if (transcripts.length > 0) {
        const transcriptId = transcripts[0].id;

        // 2. Descargar el contenido de la transcripción en formato WebVTT
        transcriptContent = (await this.appGraphClient!.api(
          `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/transcripts/${transcriptId}/content`,
        )
          .query({ '$format': 'text/vtt' })
          .responseType(ResponseType.TEXT)
          .get()) as string;
      }
    } catch (error: any) {
      this.logger.warn(`Error al intentar obtener transcripción desde Graph API: ${error.message || error}`);
    }

    if (!transcriptContent) {
      throw new BadRequestException([
        'No se encontró ninguna transcripción activa para esta reunión de Teams. Asegúrate de haber iniciado y guardado la grabación y transcripción en Teams.',
      ]);
    }


    // 3. Limpiar la transcripción (formato WebVTT -> texto plano)
    const cleanedText = this.cleanTranscript(transcriptContent);
    if (!cleanedText) {
      throw new BadRequestException([
        'La transcripción de la reunión está vacía. No hay suficiente contenido para resumir.',
      ]);
    }

    // 4. Invocar el flujo de IA con Groq
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
