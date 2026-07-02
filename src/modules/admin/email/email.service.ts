import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { EmailSendDto } from './dto/email-send.dto';
import { EmailSendResultDto } from './dto/email-send-result.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(sendEmailDto: EmailSendDto): Promise<EmailSendResultDto> {
    const tenantId = process.env.MS_GRAPH_TENANT_ID;
    const clientId = process.env.MS_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
    const senderEmail = process.env.MS_GRAPH_SENDER_EMAIL || 'no-reply@hubsme.net';

    if (!tenantId || !clientId || !clientSecret) {
      throw new InternalServerErrorException('Configuración de correo de Microsoft Graph incompleta en el servidor');
    }

    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const authProvider = new TokenCredentialAuthenticationProvider(credential, {
        scopes: ['https://graph.microsoft.com/.default'],
      });

      const client = Client.initWithMiddleware({
        authProvider,
      });

      const sendMailPayload = {
        message: {
          subject: sendEmailDto.subject,
          body: {
            contentType: sendEmailDto.html ? 'HTML' : 'Text',
            content: sendEmailDto.html || sendEmailDto.text,
          },
          toRecipients: [
            {
              emailAddress: {
                address: sendEmailDto.to,
              },
            },
          ],
        },
        saveToSentItems: true,
      };

      await client.api(`/users/${senderEmail}/sendMail`).post(sendMailPayload);

      this.logger.log(`Email sent to ${sendEmailDto.to} via Microsoft Graph`);

      return {
        message: 'Correo enviado exitosamente',
        messageId: `ms-graph-${Date.now()}`,
      };
    } catch (error) {
      this.logger.error('Error enviando correo con Microsoft Graph', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(
        `No se pudo enviar el correo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
