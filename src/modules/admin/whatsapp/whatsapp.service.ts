import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MeetingService } from '../meeting/meeting.service';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';
import { WhatsappNotificacionPymeDto } from './dto/whatsapp-notificacion-pyme.dto';
import { WhatsappNotificacionConsultorDto } from './dto/whatsapp-notificacion-consultor.dto';
import { WhatsappAlertaReunionConsultorDto } from './dto/whatsapp-alerta-reunion-consultor.dto';
import { WhatsappAlertaReunionDto } from './dto/whatsapp-alerta-reunion.dto';
import { WhatsappConsultorConfirmarReunionDto } from './dto/whatsapp-consultor-confirmar-reunion.dto';
import { normalizeWhatsappPhone } from './utils/whatsapp.utils';
import type { WhatsappWebhookMessage, WhatsappWebhookPayload } from './types/whatsapp-webhook.types';

type WhatsappProviderResponse = Record<string, unknown> | string | null;
type ProposedOption = {
  meetingId: number;
  optionIndex: number;
};

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly processingMeetingIds = new Set<number>();

  constructor(
    @Inject(forwardRef(() => MeetingService))
    private readonly meetingService: MeetingService,
    private readonly consultantRepository: ConsultantRepository,
  ) {}

  private async sendToMeta(
    payload: Record<string, unknown>,
  ): Promise<{ status: number; body: WhatsappProviderResponse }> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      this.logger.error('WhatsApp credentials are not configured in environment variables');
      throw new InternalServerErrorException('Las credenciales de WhatsApp no están configuradas');
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await this.parseProviderResponse(response);

      if (!response.ok) {
        this.logger.error(`Meta API failed with status ${response.status}: ${JSON.stringify(responseBody)}`);
        throw new InternalServerErrorException('No se pudo enviar el mensaje por WhatsApp');
      }

      return {
        status: response.status,
        body: responseBody,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Error sending message through Meta API', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(
        `No se pudo enviar el mensaje por WhatsApp: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  async sendMessage(sendMessageDto: WhatsappSendDto): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(sendMessageDto.phone);
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: {
        preview_url: false,
        body: sendMessageDto.message,
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp message sent to ${phone}`);

    return {
      message: 'Mensaje enviado exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendNotificacionPyme(to: string, dto: WhatsappNotificacionPymeDto): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'notificacion_pyme',
        language: {
          code: 'es_PE',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'nombre_pyme',
                text: dto.nombre_pyme,
              },
              {
                type: 'text',
                parameter_name: 'nombre_consultor',
                text: dto.nombre_consultor,
              },
              {
                type: 'text',
                parameter_name: 'titulo_sesion',
                text: dto.titulo_sesion,
              },
              {
                type: 'text',
                parameter_name: 'fecha_hora',
                text: dto.fecha_hora,
              },
              {
                type: 'text',
                parameter_name: 'duracion',
                text: dto.duracion,
              },
            ],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp template notificacion_pyme sent to ${phone}`);

    return {
      message: 'Plantilla de notificación pyme enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendNotificacionConsultor(to: string, dto: WhatsappNotificacionConsultorDto): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'notificacion_consultor',
        language: {
          code: 'es_PE',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'nombre_consultor',
                text: dto.nombre_consultor,
              },
              {
                type: 'text',
                parameter_name: 'nombre_pyme',
                text: dto.nombre_pyme,
              },
              {
                type: 'text',
                parameter_name: 'titulo_sesion',
                text: dto.titulo_sesion,
              },
              {
                type: 'text',
                parameter_name: 'fecha_hora',
                text: dto.fecha_hora,
              },
              {
                type: 'text',
                parameter_name: 'duracion',
                text: dto.duracion,
              },
            ],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp template notificacion_consultor sent to ${phone}`);

    return {
      message: 'Plantilla de notificación consultor enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendAlertaReunionConsultor(to: string, dto: WhatsappAlertaReunionConsultorDto): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'alerta_reunion_consultor',
        language: {
          code: 'es_PE',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'nombre_consultor',
                text: dto.nombre_consultor,
              },
              {
                type: 'text',
                parameter_name: 'tiempo_restante',
                text: dto.tiempo_restante,
              },
              {
                type: 'text',
                parameter_name: 'nombre_pyme',
                text: dto.nombre_pyme,
              },
              {
                type: 'text',
                parameter_name: 'titulo_sesion',
                text: dto.titulo_sesion,
              },
              {
                type: 'text',
                parameter_name: 'fecha_hora',
                text: dto.fecha_hora,
              },
              {
                type: 'text',
                parameter_name: 'tiempo',
                text: dto.tiempo,
              },
              {
                type: 'text',
                parameter_name: 'enlace',
                text: dto.enlace,
              },
            ],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp template alerta_reunion_consultor sent to ${phone}`);

    return {
      message: 'Plantilla de alerta de reunión consultor enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendAlertaReunionPyme(to: string, dto: WhatsappAlertaReunionDto): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'alerta_reunion_pyme',
        language: {
          code: 'es_PE',
        },
        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                parameter_name: 'nombre_pyme',
                text: dto.nombre_pyme,
              },
              {
                type: 'text',
                parameter_name: 'tiempo_restante',
                text: dto.tiempo_restante,
              },
              {
                type: 'text',
                parameter_name: 'nombre_consultor',
                text: dto.nombre_consultor,
              },
              {
                type: 'text',
                parameter_name: 'titulo_sesion',
                text: dto.titulo_sesion,
              },
              {
                type: 'text',
                parameter_name: 'fecha_hora',
                text: dto.fecha_hora,
              },
              {
                type: 'text',
                parameter_name: 'tiempo',
                text: dto.tiempo,
              },
              {
                type: 'text',
                parameter_name: 'enlace',
                text: dto.enlace,
              },
            ],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp template alerta_reunion_pyme sent to ${phone}`);

    return {
      message: 'Plantilla de alerta de reunión pyme enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendConsultorConfirmarReunion(
    to: string,
    dto: WhatsappConsultorConfirmarReunionDto,
  ): Promise<WhatsappSendResultDto> {
    const phone = normalizeWhatsappPhone(to);
    const buttonPayload = (option: 'a' | 'b' | 'c') => `meeting:${dto.reunion_id}:option:${option}`;
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'consultor_confirmar_reunion',
        language: { code: 'es_PE' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', parameter_name: 'nombre_consultor', text: dto.nombre_consultor },
              { type: 'text', parameter_name: 'nombre_pyme', text: dto.nombre_pyme },
              { type: 'text', parameter_name: 'tema_reunion', text: dto.tema_reunion },
              { type: 'text', parameter_name: 'duracion_reunion', text: dto.duracion_reunion },
              { type: 'text', parameter_name: 'horario_opcion_a', text: dto.horario_opcion_a },
              { type: 'text', parameter_name: 'horario_opcion_b', text: dto.horario_opcion_b },
              { type: 'text', parameter_name: 'horario_opcion_c', text: dto.horario_opcion_c },
            ],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '0',
            parameters: [{ type: 'payload', payload: buttonPayload('a') }],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '1',
            parameters: [{ type: 'payload', payload: buttonPayload('b') }],
          },
          {
            type: 'button',
            sub_type: 'quick_reply',
            index: '2',
            parameters: [{ type: 'payload', payload: buttonPayload('c') }],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);
    this.logger.log(`WhatsApp template consultor_confirmar_reunion sent to ${phone}`);

    return {
      message: 'Plantilla de confirmación de reunión enviada al consultor',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  verifySubscription(mode?: string, token?: string, challenge?: string): string {
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (!verifyToken) {
      throw new InternalServerErrorException('El token de verificación del webhook no está configurado');
    }
    if (mode !== 'subscribe' || token !== verifyToken || !challenge) {
      throw new ForbiddenException('No se pudo verificar el webhook de WhatsApp');
    }
    return challenge;
  }

  acceptWebhook(payload: WhatsappWebhookPayload, rawBody: Buffer | undefined, signature?: string) {
    const resolvedPayload = this.resolveWebhookPayload(payload, rawBody);

    this.assertMetaSignature(rawBody, signature);

    void this.processIncomingMessages(resolvedPayload).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error procesando el webhook de WhatsApp: ${message}`);
    });

    return { received: true };
  }

  private resolveWebhookPayload(payload: WhatsappWebhookPayload, rawBody: Buffer | undefined): WhatsappWebhookPayload {
    if (payload.object || payload.entry?.length) {
      return payload;
    }

    if (!rawBody?.length) {
      return payload;
    }

    const rawText = rawBody.toString('utf8');
    try {
      return JSON.parse(rawText) as WhatsappWebhookPayload;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo reconstruir el payload del webhook de WhatsApp: ${message}`);
      return payload;
    }
  }

  private async processIncomingMessages(payload: WhatsappWebhookPayload) {
    if (payload.object !== 'whatsapp_business_account') {
      return;
    }

    const messages = (payload.entry ?? []).flatMap((entry) =>
      (entry.changes ?? [])
        .filter((change) => change.field === 'messages')
        .flatMap((change) => change.value?.messages ?? []),
    );

    for (const message of messages) {
      await this.processMeetingOptionReply(message);
    }
  }

  private async processMeetingOptionReply(message: WhatsappWebhookMessage) {
    const payload = this.getButtonPayload(message);
    const option = payload ? this.parseProposedOption(payload) : undefined;
    if (!option || !message.from) {
      return;
    }

    if (this.processingMeetingIds.has(option.meetingId)) {
      this.logger.warn(`La reunión ${option.meetingId} ya está siendo procesada desde WhatsApp`);
      return;
    }

    this.processingMeetingIds.add(option.meetingId);
    try {
      const meeting = await this.meetingService.findOne(option.meetingId);
      const consultant = await this.consultantRepository.findOne(meeting.consultantId);
      if (!consultant?.ownerPhone) {
        throw new UnauthorizedException('La reunión no tiene un consultor con WhatsApp configurado');
      }

      const senderPhone = normalizeWhatsappPhone(message.from);
      const consultantPhone = normalizeWhatsappPhone(consultant.ownerPhone);
      if (senderPhone !== consultantPhone) {
        throw new UnauthorizedException('El remitente no corresponde al consultor de la reunión');
      }

      const selectedStartTime = meeting.proposedStartTimes?.[option.optionIndex];
      if (!selectedStartTime) {
        throw new UnauthorizedException('La opción seleccionada no existe para esta reunión');
      }

      if (meeting.status === 'confirmada') {
        await this.sendAlreadyConfirmedMessage(senderPhone, meeting.startTime);
        return;
      }

      await this.meetingService.confirmProposedOption(meeting.id, { selectedStartTime });
      this.logger.log(`Reunión ${meeting.id} confirmada por WhatsApp con la opción ${option.optionIndex + 1}`);
    } finally {
      this.processingMeetingIds.delete(option.meetingId);
    }
  }

  private getButtonPayload(message: WhatsappWebhookMessage): string | undefined {
    if (message.type === 'button') return message.button?.payload;
    if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
      return message.interactive.button_reply?.id;
    }
    return undefined;
  }

  private parseProposedOption(payload: string): ProposedOption | undefined {
    const match = /^meeting:(\d+):option:([abc])$/i.exec(payload.trim());
    if (!match) {
      return undefined;
    }

    return {
      meetingId: Number(match[1]),
      optionIndex: match[2].toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0),
    };
  }

  private async sendAlreadyConfirmedMessage(phone: string, startTime: Date | string | null) {
    const confirmedTime = startTime ? this.formatMeetingDateTime(startTime) : 'el horario confirmado';
    await this.sendMessage({
      phone,
      message: `Esta reunión ya fue confirmada para ${confirmedTime}. El horario ya no se puede cambiar desde WhatsApp.`,
    });
  }

  private formatMeetingDateTime(value: Date | string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(value));
  }

  private assertMetaSignature(rawBody: Buffer | undefined, signature?: string) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      throw new InternalServerErrorException('El secreto de la aplicación de Meta no está configurado');
    }
    if (!rawBody || !signature?.startsWith('sha256=')) {
      throw new UnauthorizedException('Firma de webhook ausente');
    }

    const expectedSignature = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new UnauthorizedException('Firma de webhook inválida');
    }
  }

  private async parseProviderResponse(response: Response): Promise<WhatsappProviderResponse> {
    const rawResponse = await response.text();

    if (!rawResponse) {
      return null;
    }

    try {
      return JSON.parse(rawResponse) as Record<string, unknown>;
    } catch {
      return rawResponse;
    }
  }
}
