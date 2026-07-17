import { BadRequestException } from '@nestjs/common';

export function normalizeWhatsappPhone(phone: string): string {
  const cleanPhone = phone.trim().replace(/@s\.whatsapp\.net$/, '');
  const digits = cleanPhone.replace(/\D/g, '');

  if (!digits) {
    throw new BadRequestException('El número de WhatsApp no es válido');
  }

  return digits;
}
