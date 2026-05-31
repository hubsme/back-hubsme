import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { MeetingTeamsJoinResponseDto } from './dto/meeting-teams-join.dto';

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
      const authProvider = new TokenCredentialAuthenticationProvider(
        this.clientSecretCredential,
        {
          scopes: ['https://graph.microsoft.com/.default'],
        },
      );

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
    const endDateTime = new Date(
      data.startTime.getTime() + data.durationMinutes * 60_000,
    ).toISOString();

    const event = {
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
      const newEvent = await this.appGraphClient!
        .api(`/users/${organizerUserId}/calendar/events`)
        .post(event);

      if (!newEvent || !newEvent.onlineMeeting?.joinUrl || !newEvent.id) {
        throw new Error('El payload devuelto no contiene la información de onlineMeeting esperada.');
      }

      return { id: newEvent.id, joinWebUrl: newEvent.onlineMeeting.joinUrl };
    } catch (error: any) {
      const graphError = error.message || JSON.stringify(error);
      this.logger.error(`Microsoft Graph calendar events failed: ${graphError}`);
      throw new InternalServerErrorException(
        `No se pudo crear la reunión de Microsoft Teams (${graphError})`,
      );
    }
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

  private maskValue(value?: string): string {
    if (!value) return 'missing';
    if (value.length <= 8) return '***';
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
