import { BadRequestException } from '@nestjs/common';

export function normalizeWhatsappPhone(phone: string): string {
  const digits = phone
    .trim()
    .replace(/@s\.whatsapp\.net$/i, '')
    .replace(/[^\d]/g, '');

  if (!digits) {
    throw new BadRequestException('El número de WhatsApp no es válido');
  }

  return digits;
}
