import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { ClientSecretCredential } from '@azure/identity';
import { Client, ResponseType } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { MeetingTeamsJoinResponseDto } from './dto/meeting-teams-join.dto';
import {
  GraphCalendarEvent,
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
  private identityClient?: CommunicationIdentityClient;
  private appGraphClient?: Client;
  private clientSecretCredential?: ClientSecretCredential;

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
    } catch (error: any) {
      const graphError = error.message || JSON.stringify(error);
      this.logger.error(`Microsoft Graph calendar-backed Teams meeting creation failed: ${graphError}`);
      throw new InternalServerErrorException(`No se pudo crear la reunión de Microsoft Teams (${graphError})`);
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

  private async updateOnlineMeetingSettings(onlineMeetingId: string): Promise<void> {
    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;

    await this.appGraphClient!.api(`/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}`).patch({
      recordAutomatically: true,
      allowedPresenters: 'everyone',
      lobbyBypassSettings: {
        scope: 'everyone',
      },
    });
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

  async createAnonymousJoinToken(data: {
    meetingId: number;
    meetingUrl: string;
    displayName?: string;
  }): Promise<MeetingTeamsJoinResponseDto> {
    const client = this.getIdentityClient();
    const { user, token, expiresOn } = await client.createUserAndToken(['voip']);

    return {
      meetingId: data.meetingId,
      meetingUrl: data.meetingUrl,
      acsUserId: user.communicationUserId,
      token,
      expiresOn,
      displayName: data.displayName,
    };
  }

  async getOnlineMeetingAiInsights(onlineMeetingId: string): Promise<{ meetingNotes: any[]; actionItems: any[] }> {
    this.assertGraphConfig();
    this.ensureGraphForAppOnlyAuth();

    const organizerUserId = process.env.MS_GRAPH_TEAMS_ORGANIZER_USER_ID;
    this.logger.log(`Obteniendo transcripción para onlineMeetingId: ${onlineMeetingId}`);

    let transcriptContent = '';
    try {
      // 1. Listar transcripciones
      const transcriptsResponse = (await this.appGraphClient!.api(
        `/users/${organizerUserId}/onlineMeetings/${onlineMeetingId}/transcripts`,
      ).get()) as GraphListResponse<{ id: string }>;

      const transcripts = transcriptsResponse.value ?? [];
      if (transcripts.length > 0) {
        const transcriptId = transcripts[0].id;
        this.logger.log(`Transcripción encontrada: ${transcriptId}. Descargando contenido...`);

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

    // 4. Invocar el flujo de Power Automate
    const powerAutomateUrl = 'https://aa50c4112851ede8b0a69e71b5bf72.e4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/50a2be3614d84f94a69a55e4aec13362/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-Z930_es4R6VpwUkyJmg_jmisTBP7ZvSr2FcPig6oz0';


    this.logger.log(`Enviando transcripción limpia a Power Automate para su procesamiento...`);
    try {
      const response = await fetch(powerAutomateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanedText,
          prompt: 'Genera notas de discusión y compromisos',
        }),
      });

      if (!response.ok) {
        throw new Error(`Power Automate respondió con estado ${response.status}`);
      }

      const data = (await response.json()) as { result?: string };
      const resultText = data.result || '';

      // 5. Parsear la respuesta en la estructura esperada por el frontend
      return this.parsePowerAutomateResult(resultText);
    } catch (error: any) {
      this.logger.error(`Error al invocar la API de Power Automate: ${error.message || error}`);
      throw new InternalServerErrorException(
        `Error al procesar el resumen de la reunión con Power Automate (${error.message || error})`,
      );
    }
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

  private parsePowerAutomateResult(result: string): {
    meetingNotes: { title: string; text: string }[];
    actionItems: { title: string; text: string; ownerDisplayName: string | null }[];
  } {
    const meetingNotes: { title: string; text: string }[] = [];
    const actionItems: { title: string; text: string; ownerDisplayName: string | null }[] = [];

    if (!result) {
      return { meetingNotes, actionItems };
    }

    const lines = result.split(/\r?\n/);
    let currentSection: 'notes' | 'tasks' | null = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const normalizedLine = line.toLowerCase();
      if (
        normalizedLine.includes('temas discutidos') ||
        normalizedLine.includes('notas de la reunión') ||
        normalizedLine.includes('resumen')
      ) {
        currentSection = 'notes';
        continue;
      } else if (
        normalizedLine.includes('tareas') ||
        normalizedLine.includes('compromisos') ||
        normalizedLine.includes('acciones') ||
        normalizedLine.includes('action items')
      ) {
        currentSection = 'tasks';
        continue;
      }

      // Validar si es una viñeta o punto de lista
      if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
        let content = line.replace(/^[-*\s]+/, '').replace(/^\d+\.\s*/, '').trim();
        if (!content) continue;

        if (currentSection === 'notes') {
          const colonIdx = content.indexOf(':');
          if (colonIdx > 0 && colonIdx < 40) {
            const title = content.substring(0, colonIdx).trim().replace(/\*\*/g, '');
            const text = content.substring(colonIdx + 1).trim();
            meetingNotes.push({ title, text });
          } else {
            meetingNotes.push({ title: 'Punto clave', text: content });
          }
        } else if (currentSection === 'tasks') {
          let owner: string | null = null;

          // Intentar extraer el nombre del responsable entre paréntesis (ej: "Tarea X (Juan): ...")
          const parenthesizedMatch = content.match(/\(([^)]+)\)/);
          if (parenthesizedMatch && parenthesizedMatch.index && parenthesizedMatch.index < 45) {
            owner = parenthesizedMatch[1].trim();
            content = content.replace(/\([^)]+\)/, '').trim();
          }

          const colonIdx = content.indexOf(':');
          if (colonIdx > 0 && colonIdx < 40) {
            const title = content.substring(0, colonIdx).trim().replace(/\*\*/g, '');
            const text = content.substring(colonIdx + 1).trim();
            actionItems.push({ title, text, ownerDisplayName: owner });
          } else {
            actionItems.push({ title: 'Compromiso', text: content, ownerDisplayName: owner });
          }
        }
      }
    }

    // Fallback: Si no se estructuró nada, volcar todo el texto en una nota general
    if (meetingNotes.length === 0 && actionItems.length === 0) {
      meetingNotes.push({
        title: 'Resumen General',
        text: result.trim(),
      });
    }

    return { meetingNotes, actionItems };
  }

  private getIdentityClient(): CommunicationIdentityClient {
    const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
    if (!connectionString) {
      throw new BadRequestException(['Configura AZURE_COMMUNICATION_CONNECTION_STRING para emitir tokens ACS']);
    }

    this.identityClient ??= new CommunicationIdentityClient(connectionString);
    return this.identityClient;
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
