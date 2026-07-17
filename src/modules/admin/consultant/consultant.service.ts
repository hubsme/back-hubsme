import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantMeetingPymesFiltersDto } from './dto/consultant-meeting-pymes.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantDTO } from '@db/tables/consultant.table';
import { ConsultantCaseStudyDto, ConsultantEducationDto } from './dto/consultant-profile-fields.dto';
import { UserService } from '../user/user.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { WhatsappNotificacionConsultorDto } from '../whatsapp/dto/whatsapp-notificacion-consultor.dto';
import { EmailService } from '../email/email.service';
import { ConsultantDiagnosticArea } from '@core/consultant-diagnostic-area';

@Injectable()
export class ConsultantService {
  constructor(
    private readonly consultantRepository: ConsultantRepository,
    private readonly pymeRepository: PymeRepository,
    private readonly userService: UserService,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
  ) {}

  async findAllPaginated(filters: ConsultantListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.consultantRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const consultant = await this.consultantRepository.findOne(id);
    if (!consultant) throw new NotFoundException(`Consultant with ID ${id} not found`);
    return consultant;
  }

  async findByUserId(userId: number) {
    const consultant = await this.consultantRepository.findByUserId(userId);
    if (!consultant) throw new NotFoundException(`Consultant profile for user ID ${userId} not found`);
    return consultant;
  }

  async findMeetingPymes(userId: number, filters: ConsultantMeetingPymesFiltersDto) {
    await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.pymeRepository.findByConsultantMeetingsPaginated(userId, page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async create(data: ConsultantCreateDto) {
    try {
      const { userId, ...rest } = data;
      const cleanData = this.clean(rest);
      const validated = cleanData.photoUrl && cleanData.videoUrl ? 'true' : 'false';
      return await this.consultantRepository.create({
        id: userId,
        ...cleanData,
        validated,
      } as ConsultantDTO);
    } catch (error) {
      handleDbError(error);
    }
  }

  async update(id: number, data: ConsultantUpdateDto) {
    const existing = await this.findOne(id);
    try {
      const cleanedUpdates = this.clean(data);
      const photoUrl = cleanedUpdates.photoUrl !== undefined ? cleanedUpdates.photoUrl : existing.photoUrl;
      const videoUrl = cleanedUpdates.videoUrl !== undefined ? cleanedUpdates.videoUrl : existing.videoUrl;
      const validated = photoUrl && videoUrl ? 'true' : 'false';

      return await this.consultantRepository.update(id, {
        ...cleanedUpdates,
        validated,
      });
    } catch (error) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.consultantRepository.delete(id);
  }

  private clean<T extends Partial<ConsultantCreateDto>>(data: T): Partial<ConsultantDTO> {
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      fullName: this.buildFullName(data),
      ownerPhone: data.ownerPhone?.trim(),
      headline: data.headline?.trim(),
      location: data.location?.trim(),
      workModality: data.workModality?.trim(),
      linkedinUrl: data.linkedinUrl?.trim(),
      bio: data.bio?.trim(),
      diagnosticAreas: this.cleanDiagnosticAreas(data.diagnosticAreas),
      specialties: this.cleanTextList(data.specialties),
      sectors: this.cleanTextList(data.sectors),
      industries: this.cleanTextList(data.industries),
      companyTypes: this.cleanTextList(data.companyTypes),
      services: this.cleanTextList(data.services),
      yearsExperience: data.yearsExperience,
      education: this.cleanEducation(data.education),
      certifications: this.cleanTextList(data.certifications),
      workedSectors: this.cleanTextList(data.workedSectors),
      caseStudies: this.cleanCaseStudies(data.caseStudies),
      cvText: data.cvText?.trim(),
      cvUrl: data.cvUrl?.trim(),
      photoUrl: data.photoUrl?.trim(),
      videoUrl: data.videoUrl?.trim(),
      pricePerHour: data.pricePerHour === undefined ? undefined : data.pricePerHour.toFixed(2),
    };
  }

  private buildFullName(data: Partial<ConsultantCreateDto>) {
    const explicitFullName = data.fullName?.trim();
    if (explicitFullName) return explicitFullName;

    return [data.firstName?.trim(), data.lastName?.trim()].filter(Boolean).join(' ');
  }

  private cleanTextList(value?: string[]) {
    return value?.map((item) => item.trim().replace(/\s+/g, ' ')).filter(Boolean);
  }

  private cleanDiagnosticAreas(value?: ConsultantDiagnosticArea[]) {
    return value ? [...new Set(value)] : undefined;
  }

  private cleanEducation(value?: ConsultantEducationDto[]) {
    return value
      ?.map((item) => ({
        degree: item.degree?.trim().replace(/\s+/g, ' '),
        institution: item.institution?.trim().replace(/\s+/g, ' ') || undefined,
        year: item.year?.trim().replace(/\s+/g, ' ') || undefined,
      }))
      .filter((item) => item.degree);
  }

  private cleanCaseStudies(value?: ConsultantCaseStudyDto[]) {
    return value
      ?.map((item) => ({
        title: item.title?.trim().replace(/\s+/g, ' '),
        problem: item.problem?.trim().replace(/\s+/g, ' ') || undefined,
        action: item.action?.trim().replace(/\s+/g, ' ') || undefined,
        result: item.result?.trim().replace(/\s+/g, ' ') || undefined,
        sector: item.sector?.trim().replace(/\s+/g, ' ') || undefined,
      }))
      .filter((item) => item.title);
  }

  async sendMeetingNotification(
    consultantId: number,
    pymeName: string,
    meetingTitle: string,
    startTime: Date,
    durationMinutes: number,
  ) {
    try {
      const consultant = await this.consultantRepository.findOne(consultantId);
      if (!consultant) return;

      const user = await this.userService.findOne(consultantId);
      if (!user) return;

      const dateStr = startTime.toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. WhatsApp notification
      if (consultant.ownerPhone?.trim()) {
        try {
          await this.whatsappService.sendNotificacionConsultor(consultant.ownerPhone, {
            to: consultant.ownerPhone,
            nombre_consultor: consultant.fullName,
            nombre_pyme: pymeName,
            titulo_sesion: meetingTitle,
            fecha_hora: dateStr,
            duracion: `${durationMinutes} minutos`,
          });
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }

      // 2. Email notification
      if (user.email?.trim()) {
        const emailSubject = `Nueva sesión de consultoría agendada - HUBSME`;
        const emailText = `Hola ${consultant.fullName},\n\n¡Felicidades! Se ha agendado y confirmado una nueva reunión de consultoría de tipo "${meetingTitle}" con la PYME "${pymeName}".\n\nDetalles de la reunión:\n- Fecha y hora: ${dateStr}\n- Duración: ${durationMinutes} minutos\n\nSaludos,\nEl equipo de HUBSME`;
        try {
          await this.emailService.sendEmail({
            to: user.email,
            subject: emailSubject,
            text: emailText,
          });
        } catch (error) {
          console.error('Error sending email notification:', error);
        }
      }
    } catch (error) {
      // General silent catch to ensure fire-and-forget safety
    }
  }

  async sendMeetingPendingConfirmationNotification(
    meetingId: number,
    consultantId: number,
    pymeName: string,
    meetingTitle: string,
    proposedStartTimes: Date[],
    durationMinutes: number,
  ) {
    try {
      const consultant = await this.consultantRepository.findOne(consultantId);
      if (!consultant) return;

      const user = await this.userService.findOne(consultantId);
      const formattedOptions = proposedStartTimes.map((startTime) => this.formatProposedStartTime(startTime));

      if (consultant.ownerPhone?.trim() && formattedOptions.length === 3) {
        try {
          await this.whatsappService.sendConsultorConfirmarReunion(consultant.ownerPhone, {
            to: consultant.ownerPhone,
            reunion_id: meetingId,
            nombre_consultor: consultant.fullName,
            nombre_pyme: pymeName,
            tema_reunion: meetingTitle,
            duracion_reunion: `${durationMinutes} minutos`,
            horario_opcion_a: formattedOptions[0],
            horario_opcion_b: formattedOptions[1],
            horario_opcion_c: formattedOptions[2],
          });
        } catch {
          // El correo se intenta aunque Meta no pueda entregar la plantilla.
        }
      }

      if (!user?.email?.trim()) return;

      const optionsText = this.formatProposedStartTimes(proposedStartTimes);
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Nueva reunión pagada por confirmar - HUBSME',
        text: `Hola ${consultant.fullName},\n\nLa PYME "${pymeName}" pagó una reunión contigo sobre "${meetingTitle}".\n\nDebes ingresar a tu calendario HUBSME y escoger uno de estos horarios propuestos:\n${optionsText}\n\nDuración: ${durationMinutes} minutos\n\nSaludos,\nEl equipo de HUBSME`,
      });
    } catch {
      // General silent catch to ensure fire-and-forget safety
    }
  }

  private formatProposedStartTimes(proposedStartTimes: Date[]) {
    return proposedStartTimes
      .map((startTime, index) => {
        const dateStr = this.formatProposedStartTime(startTime);
        return `${index + 1}. ${dateStr}`;
      })
      .join('\n');
  }

  private formatProposedStartTime(startTime: Date) {
    return startTime.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
