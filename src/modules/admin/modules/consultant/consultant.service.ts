import { Trace } from '@erixcel/traceflow';
import { DbErrorFunction } from '@functions/db-error.function';
import { ConsultantApprovalDto } from '@modules/admin/modules/consultant/controllers/consultant-admin/dto/approve.dto';
import { ConsultantCreateDto } from '@modules/admin/modules/consultant/dto/create.dto';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
  ConsultantListFiltersDto,
} from '@modules/admin/modules/consultant/dto/find-all.dto';
import { ConsultantMeetingPymesFiltersDto } from '@modules/admin/modules/consultant/dto/meeting-pymes.dto';
import { ConsultantActiveDto } from '@modules/admin/modules/consultant/dto/set-active.dto';
import { ConsultantUpdateDto } from '@modules/admin/modules/consultant/dto/update.dto';
import { ForbiddenException, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { DiagnosticJoinQuery } from '@queries/diagnostic/diagnostic-join.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';

import { DateFunction } from '@functions/date.function';
import { MeetingAccessUrlFunction } from '@functions/meeting-access-url.function';
import { ConsultantDocumentListFiltersDto } from '@modules/admin/modules/consultant/dto/meeting-documents.dto';
import { EmailService } from '@modules/admin/modules/email/email.service';
import { MercadoPagoAccountService } from '@modules/admin/modules/mercado-pago/modules/mercado-pago-account/mercado-pago-account.service';
import { UserService } from '@modules/admin/modules/user/user.service';
import { WhatsappService } from '@modules/admin/modules/whatsapp/whatsapp.service';

// Gestiona los perfiles de los consultores.
@Trace({ name: 'consultant', type: 'service' })
@Injectable()
export class ConsultantService {
  constructor(
    private readonly userService: UserService,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
    private readonly mercadoPagoAccountService: MercadoPagoAccountService,
    private readonly consultantQuery: ConsultantQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
    private readonly pymeJoinQuery: PymeJoinQuery,
    private readonly meetingJoinQuery: MeetingJoinQuery,
    private readonly diagnosticJoinQuery: DiagnosticJoinQuery,
  ) {}

  async findAllPaginated(filters: ConsultantListFiltersDto, onlyAvailable = false) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const listFilters = onlyAvailable ? { ...filters, active: 'true', validated: 'true' as const } : filters;
    const { data, total } = await this.consultantQuery.findAllPaginated(page, limit, listFilters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const consultant = await this.consultantJoinQuery.findOne(id);
    if (!consultant) throw new NotFoundException(`Consultant with ID ${id} not found`);
    return consultant;
  }

  async findMercadoPagoDetails(id: number) {
    await this.findOne(id);
    return this.mercadoPagoAccountService.findAdminDetails(id);
  }

  async findMercadoPagoFinancialDetails(id: number) {
    await this.findOne(id);
    return this.mercadoPagoAccountService.findFinancialDetails(id);
  }

  async downloadMercadoPagoFinancialReport(id: number, taskId?: string) {
    await this.findOne(id);
    return this.mercadoPagoAccountService.downloadLatestFinancialReport(id, taskId);
  }

  async downloadMercadoPagoFinancialResponse(id: number, taskId?: string) {
    const result = await this.downloadMercadoPagoFinancialReport(id, taskId);
    if (result.kind === 'processing') {
      return { status: 'processing' as const, taskId: result.taskId, message: result.message };
    }

    const safeFileName = result.fileName.replace(/[\r\n"]/g, '_');
    return new StreamableFile(result.buffer, {
      type: result.contentType,
      disposition: `attachment; filename="${safeFileName}"`,
    });
  }

  async findByUserId(userId: number) {
    const consultant = await this.consultantJoinQuery.findByUserId(userId);
    if (!consultant) throw new NotFoundException(`Consultant profile for user ID ${userId} not found`);
    return consultant;
  }

  async findMeetingPymes(userId: number, filters: ConsultantMeetingPymesFiltersDto) {
    await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.pymeJoinQuery.findByConsultantMeetingsPaginated(userId, page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findMeetingDocuments(userId: number, filters: ConsultantDocumentListFiltersDto) {
    await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.meetingJoinQuery.findConsultantDocumentsPaginated(
      userId,
      page,
      limit,
      filters.search,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findDiagnosticDocuments(userId: number, filters: ConsultantDocumentListFiltersDto) {
    await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.diagnosticJoinQuery.findConsultantDocumentsPaginated(
      userId,
      page,
      limit,
      filters.search,
    );
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
      return await this.consultantQuery.create({
        id: userId,
        ...cleanData,
        validated: 'false',
      } as Parameters<ConsultantQuery['create']>[0]);
    } catch (error) {
      DbErrorFunction.handleDbError(error);
    }
  }

  async update(id: number, data: ConsultantUpdateDto) {
    await this.findOne(id);
    try {
      const cleanedUpdates = this.clean(data);
      return await this.consultantQuery.update(id, cleanedUpdates);
    } catch (error) {
      DbErrorFunction.handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.consultantQuery.delete(id);
  }

  async setValidation(id: number, data: ConsultantApprovalDto) {
    await this.findOne(id);
    await this.consultantQuery.update(id, { validated: data.validated });
    return this.findOne(id);
  }

  async setActive(id: number, data: ConsultantActiveDto, requesterId?: number) {
    if (requesterId !== undefined && requesterId !== id) {
      throw new ForbiddenException('No puedes cambiar la disponibilidad de otro consultor');
    }

    await this.findOne(id);
    await this.consultantQuery.update(id, { active: data.active });
    return this.findOne(id);
  }

  private clean<T extends Partial<ConsultantCreateDto>>(data: T): Partial<Parameters<ConsultantQuery['create']>[0]> {
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      dni: data.dni?.trim(),
      birthDate: data.birthDate,
      fullName: this.buildFullName(data),
      ownerPhone: data.ownerPhone?.trim(),
      headline: data.headline?.trim(),
      location: data.location?.trim(),
      workModality: data.workModality,
      linkedinUrl: this.normalizeLinkedInUrl(data.linkedinUrl),
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
      minimumBookingNoticeHours:
        data.minimumBookingNoticeHours === undefined ? undefined : (data.minimumBookingNoticeHours ?? 48),
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

  private normalizeLinkedInUrl(value?: string) {
    const trimmedValue = value?.trim();
    if (!trimmedValue) return undefined;

    return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue.replace(/^\/+/, '')}`;
  }

  private cleanDiagnosticAreas(value?: ConsultantCreateDto['diagnosticAreas'][number][]) {
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
    sessionNotes?: string | null,
  ) {
    try {
      const consultant = await this.consultantJoinQuery.findOne(consultantId);
      if (!consultant) return;

      const user = await this.userService.findOne(consultantId);
      if (!user) return;

      const dateStr = DateFunction.formatInPeru(startTime, {
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
        try {
          await this.emailService.sendMeetingConfirmedEmail({
            to: user.email,
            recipientName: consultant.fullName,
            counterpartName: pymeName,
            meetingTitle,
            dateTime: dateStr,
            duration: `${durationMinutes} minutos`,
            sessionNotes,
            recipientType: 'consultor',
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
    sessionNotes?: string | null,
  ) {
    try {
      const consultant = await this.consultantJoinQuery.findOne(consultantId);
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

      await this.emailService.sendMeetingPendingConfirmationEmail({
        to: user.email,
        recipientName: consultant.fullName,
        counterpartName: pymeName,
        meetingTitle,
        proposedStartTimes: proposedStartTimes.map((startTime) => this.formatProposedStartTime(startTime)),
        duration: `${durationMinutes} minutos`,
        sessionNotes,
        recipientType: 'consultor',
        meetingDetailsUrl: MeetingAccessUrlFunction.buildMeetingDetailUrl(meetingId, 'consultor'),
      });
    } catch {
      // General silent catch to ensure fire-and-forget safety
    }
  }

  private formatProposedStartTime(startTime: Date) {
    return DateFunction.formatInPeru(startTime, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
