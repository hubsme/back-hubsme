import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { EmailSendDto } from './dto/email-send.dto';
import { EmailSendResultDto } from './dto/email-send-result.dto';

type MeetingConfirmedEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  dateTime: string;
  duration: string;
  meetingUrl?: string | null;
  recipientType: 'pyme' | 'consultor';
};

type MeetingPendingEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  proposedStartTimes: string[];
  duration: string;
  recipientType: 'pyme' | 'consultor';
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(sendEmailDto: EmailSendDto): Promise<EmailSendResultDto> {
    const tenantId = process.env.MS_GRAPH_TENANT_ID;
    const clientId = process.env.MS_GRAPH_CLIENT_ID;
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
    const senderEmail = process.env.MS_GRAPH_SENDER_EMAIL || 'no-reply@hubsme.net';
    const senderName = process.env.MS_GRAPH_SENDER_NAME || 'HUBSME';

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
          from: {
            emailAddress: {
              address: senderEmail,
              name: senderName,
            },
          },
          sender: {
            emailAddress: {
              address: senderEmail,
              name: senderName,
            },
          },
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

  sendMeetingConfirmedEmail(data: MeetingConfirmedEmail) {
    const isPyme = data.recipientType === 'pyme';
    const subject = isPyme
      ? 'Tu reunión ya fue confirmada - HUBSME'
      : 'Nueva reunión confirmada en tu agenda - HUBSME';
    const intro = isPyme
      ? `Tu sesión con ${data.counterpartName} ya tiene horario confirmado.`
      : `La reunión con ${data.counterpartName} ya quedó confirmada en tu agenda.`;
    const eyebrow = isPyme ? 'Reunión confirmada' : 'Agenda actualizada';
    const nextStep = isPyme
      ? 'Te recomendamos ingresar unos minutos antes y tener listo el tema que quieres revisar.'
      : 'Recuerda prepararte unos minutos antes para recibir a la PYME y revisar el contexto de la sesión.';
    const cta = data.meetingUrl
      ? `<a href="${this.escapeAttribute(data.meetingUrl)}" style="${this.buttonStyle()}">Abrir reunión</a>`
      : '';

    return this.sendEmail({
      to: data.to,
      subject,
      text: [
        `Hola ${data.recipientName},`,
        '',
        intro,
        '',
        `Tema: ${data.meetingTitle}`,
        `Fecha y hora: ${data.dateTime}`,
        `Duración: ${data.duration}`,
        data.meetingUrl ? `Enlace: ${data.meetingUrl}` : undefined,
        '',
        nextStep,
        '',
        'El equipo de HUBSME',
      ]
        .filter((line): line is string => line !== undefined)
        .join('\n'),
      html: this.buildMeetingEmail({
        eyebrow,
        title: 'Tu reunión está lista',
        greeting: `Hola ${this.escapeHtml(data.recipientName)},`,
        intro: this.escapeHtml(intro),
        details: [
          { label: 'Tema', value: data.meetingTitle },
          { label: isPyme ? 'Consultor' : 'PYME', value: data.counterpartName },
          { label: 'Fecha y hora', value: data.dateTime },
          { label: 'Duración', value: data.duration },
        ],
        note: nextStep,
        cta,
      }),
    });
  }

  sendMeetingPendingConfirmationEmail(data: MeetingPendingEmail) {
    const isPyme = data.recipientType === 'pyme';
    const subject = isPyme
      ? 'Tu reunión está pendiente de confirmación - HUBSME'
      : 'Tienes una reunión por confirmar - HUBSME';
    const intro = isPyme
      ? `Recibimos tu reserva con ${data.counterpartName}. El consultor elegirá uno de los horarios propuestos.`
      : `${data.counterpartName} completó la reserva de una reunión contigo. Elige uno de los horarios propuestos para confirmar la cita.`;
    const note = isPyme
      ? 'Te avisaremos apenas el consultor confirme el horario final.'
      : 'Puedes confirmar desde WhatsApp tocando una de las opciones o desde tu calendario en HUBSME.';

    return this.sendEmail({
      to: data.to,
      subject,
      text: [
        `Hola ${data.recipientName},`,
        '',
        intro,
        '',
        `Tema: ${data.meetingTitle}`,
        `Duración: ${data.duration}`,
        '',
        'Horarios propuestos:',
        ...data.proposedStartTimes.map((value, index) => `${index + 1}. ${value}`),
        '',
        note,
        '',
        'El equipo de HUBSME',
      ].join('\n'),
      html: this.buildMeetingEmail({
        eyebrow: isPyme ? 'Reserva recibida' : 'Acción requerida',
        title: isPyme ? 'Tu reunión está por confirmarse' : 'Confirma el horario de la reunión',
        greeting: `Hola ${this.escapeHtml(data.recipientName)},`,
        intro: this.escapeHtml(intro),
        details: [
          { label: 'Tema', value: data.meetingTitle },
          { label: isPyme ? 'Consultor' : 'PYME', value: data.counterpartName },
          { label: 'Duración', value: data.duration },
        ],
        options: data.proposedStartTimes,
        note,
      }),
    });
  }

  private buildMeetingEmail(data: {
    eyebrow: string;
    title: string;
    greeting: string;
    intro: string;
    details: Array<{ label: string; value: string }>;
    options?: string[];
    note: string;
    cta?: string;
  }) {
    const details = data.details
      .map(
        (item) => `
          <tr>
            <td style="padding:12px 0;color:#64748b;font-size:13px;">${this.escapeHtml(item.label)}</td>
            <td style="padding:12px 0;color:#0f172a;font-size:14px;font-weight:700;text-align:right;">${this.escapeHtml(item.value)}</td>
          </tr>`,
      )
      .join('');
    const options = data.options?.length
      ? `
        <div style="margin-top:22px;">
          <p style="margin:0 0 10px;color:#64748b;font-size:13px;font-weight:700;text-transform:uppercase;">Horarios propuestos</p>
          ${data.options
            .map(
              (option, index) => `
                <div style="border:1px solid #dbe7f7;border-radius:12px;padding:12px 14px;margin-top:8px;background:#f8fbff;">
                  <span style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#2f77d0;color:#ffffff;font-size:12px;font-weight:800;line-height:24px;text-align:center;margin-right:8px;">${index + 1}</span>
                  <span style="color:#0f172a;font-size:14px;font-weight:700;">${this.escapeHtml(option)}</span>
                </div>`,
            )
            .join('')}
        </div>`
      : '';

    return `
      <div style="margin:0;padding:0;background:#eef4fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4fb;padding:28px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dbe7f7;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
                <tr>
                  <td style="padding:28px 30px;background:#0f172a;">
                    <div style="color:#ffffff;font-size:24px;font-weight:900;letter-spacing:.2px;">HUBSME</div>
                    <div style="margin-top:18px;display:inline-block;background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:800;text-transform:uppercase;">${this.escapeHtml(data.eyebrow)}</div>
                    <h1 style="margin:14px 0 0;color:#ffffff;font-size:28px;line-height:1.15;">${this.escapeHtml(data.title)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 30px;">
                    <p style="margin:0;color:#0f172a;font-size:17px;font-weight:800;">${data.greeting}</p>
                    <p style="margin:10px 0 22px;color:#475569;font-size:15px;line-height:1.6;">${data.intro}</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
                      ${details}
                    </table>
                    ${options}
                    <div style="margin-top:24px;padding:16px 18px;border-radius:14px;background:#eff6ff;color:#315279;font-size:14px;line-height:1.55;">
                      ${this.escapeHtml(data.note)}
                    </div>
                    ${data.cta ? `<div style="margin-top:24px;">${data.cta}</div>` : ''}
                    <p style="margin:26px 0 0;color:#64748b;font-size:13px;line-height:1.5;">Gracias por confiar en HUBSME para seguir impulsando tu negocio.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`;
  }

  private buttonStyle() {
    return 'display:inline-block;background:#2f77d0;color:#ffffff;text-decoration:none;border-radius:12px;padding:13px 18px;font-size:14px;font-weight:800;';
  }

  private escapeAttribute(value: string) {
    return this.escapeHtml(value).replace(/"/g, '&quot;');
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
