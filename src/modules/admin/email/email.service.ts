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
  reminderTime?: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
};

type MeetingReminderEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  dateTime: string;
  duration: string;
  meetingUrl?: string | null;
  reminderTime: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
};

type MeetingPendingEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  proposedStartTimes: string[];
  duration: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
};

type SupportFeedbackNotificationEmail = {
  to: string;
  feedbackId: number;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  userRole: 'pyme' | 'consultor';
  attachmentCount: number;
  adminUrl: string;
};

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

  sendMeetingConfirmedEmail(data: MeetingConfirmedEmail) {
    const isPyme = data.recipientType === 'pyme';
    const reminderTime = data.reminderTime?.trim() || '15 minutos';
    const sessionNotes = data.sessionNotes?.trim();
    const subject = isPyme ? 'Tu reunión ya fue confirmada - HUBSME' : 'Nueva reunión confirmada en tu agenda - HUBSME';
    const intro = isPyme
      ? `Tu sesión con ${data.counterpartName} ya tiene horario confirmado.`
      : `La reunión con ${data.counterpartName} ya quedó confirmada en tu agenda.`;
    const eyebrow = isPyme ? 'Reunión confirmada' : 'Agenda actualizada';
    const nextStep = `Te enviaremos un recordatorio ${reminderTime} antes de que empiece la reunión.`;
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
        sessionNotes ? '' : undefined,
        sessionNotes ? `Notas de la sesión:\n${sessionNotes}` : undefined,
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
        sessionNotes,
        note: nextStep,
        cta,
      }),
    });
  }

  sendMeetingReminderEmail(data: MeetingReminderEmail) {
    const isPyme = data.recipientType === 'pyme';
    const sessionNotes = data.sessionNotes?.trim();
    const subject = `Tu reunión empieza en ${data.reminderTime} - HUBSME`;
    const intro = isPyme
      ? `Tu sesión con ${data.counterpartName} comenzará pronto.`
      : `La reunión con ${data.counterpartName} comenzará pronto.`;
    const note =
      'Ingresa desde el botón cuando estés listo. El enlace también está disponible en tu calendario de HUBSME.';
    const cta = data.meetingUrl
      ? `<a href="${this.escapeAttribute(data.meetingUrl)}" style="${this.buttonStyle()}">Ingresar a la reunión</a>`
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
        sessionNotes ? '' : undefined,
        sessionNotes ? `Notas de la sesión:\n${sessionNotes}` : undefined,
        '',
        note,
        '',
        'El equipo de HUBSME',
      ]
        .filter((line): line is string => line !== undefined)
        .join('\n'),
      html: this.buildMeetingEmail({
        eyebrow: 'Recordatorio de reunión',
        title: `Tu reunión comienza en ${data.reminderTime}`,
        greeting: `Hola ${this.escapeHtml(data.recipientName)},`,
        intro: this.escapeHtml(intro),
        details: [
          { label: 'Tema', value: data.meetingTitle },
          { label: isPyme ? 'Consultor' : 'PYME', value: data.counterpartName },
          { label: 'Fecha y hora', value: data.dateTime },
          { label: 'Duración', value: data.duration },
        ],
        sessionNotes,
        note,
        cta,
      }),
    });
  }

  sendMeetingPendingConfirmationEmail(data: MeetingPendingEmail) {
    const isPyme = data.recipientType === 'pyme';
    const sessionNotes = data.sessionNotes?.trim();
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
        sessionNotes ? '' : undefined,
        sessionNotes ? `Notas de la sesión:\n${sessionNotes}` : undefined,
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
        sessionNotes,
        note,
      }),
    });
  }

  sendSupportFeedbackNotification(data: SupportFeedbackNotificationEmail) {
    const userRole = data.userRole === 'pyme' ? 'PYME' : 'Consultor';
    const attachmentLabel = data.attachmentCount === 1 ? '1 imagen' : `${data.attachmentCount} imágenes`;
    const subject = `[Soporte #${data.feedbackId}] ${data.title}`;

    return this.sendEmail({
      to: data.to,
      subject,
      text: [
        'Se recibió un nuevo comentario de soporte en HUBSME.',
        '',
        `Ticket: #${data.feedbackId}`,
        `Usuario: ${data.userName}`,
        `Correo: ${data.userEmail}`,
        `Perfil: ${userRole}`,
        `Título: ${data.title}`,
        `Descripción: ${data.description}`,
        `Adjuntos: ${attachmentLabel}`,
        '',
        `Revisar en el panel administrativo: ${data.adminUrl}`,
      ].join('\n'),
      html: `
        <div style="margin:0;padding:0;background:#edf5ff;font-family:Arial,Helvetica,sans-serif;color:#0b1328;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf5ff;padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #dce6f2;border-radius:20px;">
                  <tr>
                    <td style="padding:38px 42px;">
                      <img src="https://www.hubsme.net/avif/logo_completo.png" width="185" alt="HUBSME" style="display:block;border:0;max-width:185px;height:auto;margin:0 0 28px;" />
                      <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#eaf3ff;color:#0b6ee8;font-size:12px;font-weight:800;text-transform:uppercase;">Nuevo comentario de soporte</div>
                      <h1 style="margin:18px 0 10px;font-size:29px;line-height:1.2;">Ticket #${data.feedbackId}</h1>
                      <p style="margin:0;color:#435775;font-size:16px;line-height:1.55;">${this.escapeHtml(data.title)}</p>
                      <div style="height:1px;background:#dbe3ef;margin:28px 0;"></div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5;">
                        <tr><td style="padding:7px 0;color:#667792;width:115px;">Usuario</td><td style="padding:7px 0;font-weight:700;">${this.escapeHtml(data.userName)}</td></tr>
                        <tr><td style="padding:7px 0;color:#667792;">Correo</td><td style="padding:7px 0;font-weight:700;">${this.escapeHtml(data.userEmail)}</td></tr>
                        <tr><td style="padding:7px 0;color:#667792;">Perfil</td><td style="padding:7px 0;font-weight:700;">${userRole}</td></tr>
                        <tr><td style="padding:7px 0;color:#667792;">Adjuntos</td><td style="padding:7px 0;font-weight:700;">${attachmentLabel}</td></tr>
                      </table>
                      <div style="margin-top:24px;padding:18px 20px;background:#f6f9fd;border:1px solid #dbe3ef;border-radius:13px;color:#253a5b;font-size:15px;line-height:1.65;">${this.escapeHtml(data.description).replace(/\r?\n/g, '<br>')}</div>
                      <div style="margin-top:28px;text-align:center;">
                        <a href="${this.escapeAttribute(data.adminUrl)}" style="${this.buttonStyle()}">Revisar comentario</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>`,
    });
  }

  private buildMeetingEmail(data: {
    eyebrow: string;
    title: string;
    greeting: string;
    intro: string;
    details: Array<{ label: string; value: string }>;
    options?: string[];
    sessionNotes?: string;
    note: string;
    cta?: string;
  }) {
    const details = data.details
      .map((item, index) => {
        const icon = this.detailIcon(item.label);
        const border = index === 0 ? '' : 'border-top:1px solid #dbe3ef;';
        return `
          <tr>
            <td width="54" style="${border}padding:19px 0 19px 22px;color:#0b6ee8;font-size:26px;line-height:1;">${icon}</td>
            <td style="${border}padding:19px 12px;color:#435775;font-size:15px;">${this.escapeHtml(item.label)}</td>
            <td style="${border}padding:19px 22px 19px 12px;color:#0b1328;font-size:16px;font-weight:800;text-align:right;">${this.escapeHtml(item.value)}</td>
          </tr>`;
      })
      .join('');
    const options = data.options?.length
      ? `
        <div style="margin-top:26px;">
          <p style="margin:0 0 12px;color:#435775;font-size:15px;font-weight:800;">Horarios propuestos</p>
          ${data.options
            .map(
              (option, index) => `
                <div style="border:1px solid #dbe3ef;border-radius:14px;padding:14px 16px;margin-top:10px;background:#fbfdff;">
                  <span style="display:inline-block;width:28px;height:28px;border-radius:999px;background:#eaf3ff;color:#0b6ee8;border:1px solid #b9d6ff;font-size:13px;font-weight:900;line-height:28px;text-align:center;margin-right:10px;">${index + 1}</span>
                  <span style="color:#0b1328;font-size:15px;font-weight:800;">${this.escapeHtml(option)}</span>
                </div>`,
            )
            .join('')}
        </div>`
      : '';
    const sessionNotes = data.sessionNotes?.trim()
      ? `
        <div style="margin-top:26px;padding:18px 22px;border:1px solid #dbe3ef;border-radius:14px;background:#fbfdff;">
          <p style="margin:0 0 9px;color:#435775;font-size:15px;font-weight:800;">Notas de la sesión</p>
          <p style="margin:0;color:#0b1328;font-size:16px;line-height:1.6;">${this.escapeHtml(data.sessionNotes.trim()).replace(/\r?\n/g, '<br>')}</p>
        </div>`
      : '';

    return `
      <div style="margin:0;padding:0;background:#edf5ff;font-family:Arial,Helvetica,sans-serif;color:#0b1328;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#edf5ff;padding:22px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:780px;background:#ffffff;border-radius:24px;border:1px solid #dce6f2;box-shadow:0 20px 55px rgba(16,35,70,0.10);">
                <tr>
                  <td align="center" style="padding:46px 54px 30px;">
                    <img src="https://www.hubsme.net/avif/logo_completo.png" width="230" alt="HUBSME" style="display:block;border:0;outline:none;text-decoration:none;max-width:230px;height:auto;margin:0 auto 28px;" />
                    <div style="display:inline-block;background:#eaf3ff;color:#0b6ee8;border-radius:999px;padding:6px 13px;font-size:12px;font-weight:900;letter-spacing:.02em;text-transform:uppercase;">
                      <span style="display:inline-block;width:18px;height:18px;border-radius:999px;border:2px solid #0b6ee8;line-height:15px;text-align:center;margin-right:7px;font-size:12px;">✓</span>
                      ${this.escapeHtml(data.eyebrow)}
                    </div>
                    <h1 style="margin:26px 0 0;color:#0b1328;font-size:38px;line-height:1.1;font-weight:900;">${this.escapeHtml(data.title)}</h1>
                    <p style="margin:18px auto 0;color:#435775;font-size:20px;line-height:1.45;max-width:640px;">${data.intro}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 54px 44px;">
                    <div style="height:1px;background:#dbe3ef;margin:0 0 32px;"></div>
                    <p style="margin:0;color:#0b1328;font-size:22px;font-weight:900;">${data.greeting}</p>
                    <p style="margin:22px 0 22px;color:#253a5b;font-size:18px;line-height:1.6;">Te compartimos los detalles de tu reunión:</p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe3ef;border-radius:14px;border-collapse:separate;border-spacing:0;overflow:hidden;">
                      ${details}
                    </table>
                    ${options}
                    ${sessionNotes}
                    <div style="margin-top:30px;padding:18px 22px;border-radius:14px;background:#eef6ff;color:#253a5b;font-size:16px;line-height:1.55;">
                      <span style="display:inline-block;width:24px;height:24px;border-radius:999px;border:2px solid #0b6ee8;color:#0b6ee8;font-size:16px;font-weight:900;line-height:21px;text-align:center;margin-right:10px;">i</span>
                      <span>${this.escapeHtml(data.note)}</span>
                    </div>
                    ${data.cta ? `<div style="margin-top:30px;text-align:center;">${data.cta}</div>` : ''}
                    <div style="height:1px;background:#dbe3ef;margin:34px 0 24px;"></div>
                    <p style="margin:0;text-align:center;color:#435775;font-size:16px;line-height:1.5;">
                      <span style="color:#0b6ee8;font-size:24px;vertical-align:middle;margin-right:10px;">♡</span>
                      Gracias por confiar en HUBSME para seguir impulsando tu negocio.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`;
  }

  private buttonStyle() {
    return 'display:inline-block;background:#0b6ee8;color:#ffffff;text-decoration:none;border-radius:10px;padding:17px 48px;font-size:18px;font-weight:900;';
  }

  private detailIcon(label: string) {
    const normalized = label.toLowerCase();
    if (normalized.includes('tema')) return '▤';
    if (normalized.includes('consultor') || normalized.includes('pyme')) return '♙';
    if (normalized.includes('fecha')) return '□';
    if (normalized.includes('dur')) return '◷';
    return '•';
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
