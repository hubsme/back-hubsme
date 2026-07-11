import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';
import { WhatsappNotificacionPymeDto } from './dto/whatsapp-notificacion-pyme.dto';
import { WhatsappNotificacionConsultorDto } from './dto/whatsapp-notificacion-consultor.dto';
import { WhatsappAlertaReunionConsultorDto } from './dto/whatsapp-alerta-reunion-consultor.dto';
import { WhatsappAlertaReunionDto } from './dto/whatsapp-alerta-reunion.dto';

type WhatsappProviderResponse = Record<string, unknown> | string | null;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

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
    const phone = this.normalizePhoneMeta(sendMessageDto.phone);
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
    const phone = this.normalizePhoneMeta(to);
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
    const phone = this.normalizePhoneMeta(to);
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
    const phone = this.normalizePhoneMeta(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'alerta_de_reunion_consultor',
        language: {
          code: 'en',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                parameter_name: 'tiempo',
                text: dto.tiempo_header,
              },
            ],
          },
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
                parameter_name: 'tiempo',
                text: dto.tiempo_body,
              },
              {
                type: 'text',
                parameter_name: 'link_reunion',
                text: dto.link_reunion,
              },
            ],
          },
        ],
      },
    };

    const result = await this.sendToMeta(payload);

    this.logger.log(`WhatsApp template alerta_de_reunion_consultor sent to ${phone}`);

    return {
      message: 'Plantilla de alerta de reunión consultor enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  async sendAlertaReunionPyme(to: string, dto: WhatsappAlertaReunionDto): Promise<WhatsappSendResultDto> {
    const phone = this.normalizePhoneMeta(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: 'alerta_de_reunion',
        language: {
          code: 'es_PE',
        },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'text',
                parameter_name: 'tiempo',
                text: dto.tiempo_header,
              },
            ],
          },
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
                parameter_name: 'tiempo',
                text: dto.tiempo_body,
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

    this.logger.log(`WhatsApp template alerta_de_reunion sent to ${phone}`);

    return {
      message: 'Plantilla de alerta de reunión pyme enviada exitosamente',
      phone,
      providerStatus: result.status,
      providerResponse: result.body,
    };
  }

  private normalizePhoneMeta(phone: string): string {
    const trimmedPhone = phone.trim();
    const cleanPhone = trimmedPhone.replace(/@s\.whatsapp\.net$/, '');
    const digits = cleanPhone.replace(/\D/g, '');

    if (!digits) {
      throw new BadRequestException('El número de WhatsApp no es válido');
    }

    return digits;
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
