import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { WhatsappSendDto } from './dto/whatsapp-send.dto';
import { WhatsappSendResultDto } from './dto/whatsapp-send-result.dto';

type WhatsappProviderResponse = Record<string, unknown> | string | null;

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly endpoint = 'https://hubsme-whatsapp-cgavhgfqavhvepb6.chilecentral-01.azurewebsites.net/send/message';
  private readonly origin = 'https://hubsme-whatsapp-cgavhgfqavhvepb6.chilecentral-01.azurewebsites.net';
  private readonly deviceId = '44605a98-3dc5-41df-9983-855b7ab4253f';

  async sendMessage(sendMessageDto: WhatsappSendDto): Promise<WhatsappSendResultDto> {
    const phone = this.normalizePhone(sendMessageDto.phone);
    const payload = {
      phone,
      message: sendMessageDto.message,
      is_forwarded: false,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'es-US,es-419;q=0.9,es;q=0.8,en;q=0.7,pt;q=0.6',
          'Content-Type': 'application/json',
          Origin: this.origin,
          Referer: `${this.origin}/`,
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36',
          'X-Device-Id': this.deviceId,
        },
        body: JSON.stringify(payload),
      });

      const providerResponse = await this.parseProviderResponse(response);

      if (!response.ok) {
        this.logger.error(`WhatsApp provider failed with status ${response.status}: ${JSON.stringify(providerResponse)}`);
        throw new InternalServerErrorException('No se pudo enviar el mensaje por WhatsApp');
      }

      this.logger.log(`WhatsApp message sent to ${phone}`);

      return {
        message: 'Mensaje enviado exitosamente',
        phone,
        providerStatus: response.status,
        providerResponse,
      };
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error('Error enviando mensaje por WhatsApp', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException(
        `No se pudo enviar el mensaje por WhatsApp: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }

  private normalizePhone(phone: string): string {
    const trimmedPhone = phone.trim();

    if (trimmedPhone.endsWith('@s.whatsapp.net')) {
      return trimmedPhone;
    }

    const digits = trimmedPhone.replace(/\D/g, '');

    if (!digits) {
      throw new BadRequestException('El numero de WhatsApp no es valido');
    }

    return `${digits}@s.whatsapp.net`;
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
