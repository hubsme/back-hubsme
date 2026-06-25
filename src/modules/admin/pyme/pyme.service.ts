import { Injectable, NotFoundException } from '@nestjs/common';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class PymeService {
  constructor(
    private readonly pymeRepository: PymeRepository,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {}

  async findAllPaginated(filters: PymeListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.pymeRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const pyme = await this.pymeRepository.findOne(id);
    if (!pyme) throw new NotFoundException(`PYME with ID ${id} not found`);
    return pyme;
  }

  async findByUserId(userId: number) {
    const pyme = await this.pymeRepository.findByUserId(userId);
    if (!pyme) throw new NotFoundException(`PYME profile for user ID ${userId} not found`);
    return pyme;
  }

  async create(data: PymeCreateDto) {
    try {
      const { userId, ...rest } = data;
      const cleanData = this.clean(rest);
      return await this.pymeRepository.create({
        id: userId,
        ...cleanData,
      } as any);
    } catch (error) {
      handleDbError(error);
    }
  }

  async update(id: number, data: PymeUpdateDto) {
    await this.findOne(id);
    try {
      return await this.pymeRepository.update(id, this.clean(data));
    } catch (error) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.pymeRepository.delete(id);
  }

  private clean<T extends Partial<PymeCreateDto>>(data: T): T {
    return {
      ...data,
      name: data.name?.trim(),
      ruc: data.ruc?.trim(),
      ownerFirstName: data.ownerFirstName?.trim(),
      ownerLastName: data.ownerLastName?.trim(),
      ownerEmail: data.ownerEmail?.trim().toLowerCase(),
      ownerPhone: data.ownerPhone?.trim(),
      ownerPosition: data.ownerPosition?.trim(),
      sector: data.sector?.trim(),
      description: data.description?.trim(),
      logoUrl: data.logoUrl?.trim(),
    };
  }

  async sendMeetingNotification(
    pymeId: number,
    consultantName: string,
    meetingTitle: string,
    startTime: Date,
    durationMinutes: number,
  ) {
    try {
      const pyme = await this.pymeRepository.findOne(pymeId);
      if (!pyme) return;

      const dateStr = startTime.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. WhatsApp notification
      if (pyme.ownerPhone?.trim()) {
        const message = `✅ *¡Sesión de consultoría confirmada!* 💼\n\n` +
          `Hola ${pyme.ownerFirstName || pyme.name}, tu sesión ha sido agendada con éxito a través de *HUBSME*. Aquí tienes el resumen de tu cita:\n\n` +
          `👤 *Consultor:* ${consultantName}\n` +
          `📝 *Tipo de sesión:* ${meetingTitle}\n` +
          `📅 *Fecha y hora:* ${dateStr} (hora de Perú)\n` +
          `⏱️ *Duración:* ${durationMinutes} minutos\n\n` +
          `Pronto recibirás el enlace para conectarte. ¡Que tengas una excelente sesión! 🚀✨`;
        try {
          await this.whatsappService.sendMessage({
            phone: pyme.ownerPhone,
            message,
          });
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }

      // 2. Email notification
      if (pyme.ownerEmail?.trim()) {
        const emailSubject = `Confirmación de sesión de consultoría agendada - HUBSME`;
        const emailText = `Hola ${pyme.ownerFirstName || pyme.name},\n\nTe confirmamos que tu sesión de consultoría de tipo "${meetingTitle}" con el consultor "${consultantName}" ha sido agendada con éxito.\n\nDetalles de la reunión:\n- Fecha y hora: ${dateStr}\n- Duración: ${durationMinutes} minutos\n\nSaludos,\nEl equipo de HUBSME`;
        try {
          await this.emailService.sendEmail({
            to: pyme.ownerEmail,
            subject: emailSubject,
            text: emailText,
          });
        } catch (error) {
          console.error('Error sending email notification:', error);
        }
      }
    } catch {
      // General silent catch to ensure fire-and-forget safety
    }
  }
}
