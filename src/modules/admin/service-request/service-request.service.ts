import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SERVICE_REQUEST_CATEGORY_OPTIONS, ServiceRequestReferenceAttachment } from '@db/tables/service-request.table';
import { User } from '@db/tables/user.table';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { ServiceRequestRepository } from '@repositories/service-request.repository';
import { ServiceRequestCreateDto } from './dto/service-request-create.dto';
import { ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestMilestoneMeetingDto } from './dto/service-request-milestone-meeting.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';
import { StorageService } from '../../storage/storage.service';
import { ConsultantAvailabilityService } from '../consultant-availability/consultant-availability.service';
import { MeetingService } from '../meeting/meeting.service';
import {
  SERVICE_REQUEST_MAX_FILES,
  SERVICE_REQUEST_MAX_FILE_BYTES,
  hasValidServiceRequestFileSignature,
  isAllowedServiceRequestFile,
} from './service-request-upload.config';

@Injectable()
export class ServiceRequestService {
  private readonly logger = new Logger(ServiceRequestService.name);

  constructor(
    private readonly serviceRequestRepository: ServiceRequestRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly consultantAvailabilityService: ConsultantAvailabilityService,
    private readonly meetingService: MeetingService,
    private readonly storageService: StorageService,
  ) {}

  async findAllForUser(filters: ServiceRequestListFiltersDto, currentUser: User) {
    const role = this.getParticipantRole(currentUser);
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 10, 20);
    const { data, total } = await this.serviceRequestRepository.findAllPaginated(page, limit, {
      userId: currentUser.id,
      role,
      stage: filters.stage,
      status: filters.status,
      search: filters.search,
    });
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      data: data.map((item) => ({ ...item, meetings: [] })),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }

  async findOneForUser(id: number, currentUser: User) {
    const role = this.getParticipantRole(currentUser);
    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, role);
    return request;
  }

  async create(data: ServiceRequestCreateDto, files: Express.Multer.File[], currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo una PYME puede solicitar servicios');
    }

    const consultantIds = [...new Set(data.consultantIds)];
    if (!consultantIds.length || consultantIds.length > 3) {
      throw new BadRequestException(['Selecciona entre 1 y 3 consultores']);
    }
    const availableConsultants = await this.consultantRepository.findAvailableByUserIds(consultantIds);
    if (availableConsultants.length !== consultantIds.length) {
      throw new NotFoundException('Uno o más consultores seleccionados no están disponibles');
    }

    this.validateRequestDetails(data);
    this.validateFiles(files);
    const initialMeetingOptions = await this.validateInitialMeetingOptions(data, consultantIds);

    const title = data.title.trim();
    const description = data.description.trim();
    const expectedOutcome = data.expectedOutcome.trim();
    const requirements = data.requirements.trim();
    const attachments: ServiceRequestReferenceAttachment[] = [];

    try {
      for (const file of files) {
        const uploaded = await this.storageService.upload(file, `service-requests/${currentUser.id}/${randomUUID()}`);
        attachments.push({
          storagePath: uploaded.publicId,
          fileUrl: uploaded.secureUrl,
          originalName: file.originalname.slice(0, 255),
          mimeType: file.mimetype,
          sizeBytes: file.size,
        });
      }

      const created = await this.serviceRequestRepository.createMany(
        consultantIds.map((consultantId) => ({
          pymeId: currentUser.id,
          consultantId,
          title,
          category: data.category,
          subcategory: data.subcategory.trim(),
          description,
          expectedOutcome,
          requirements,
          deliverables: this.cleanStringList(data.deliverables),
          exclusions: this.cleanOptionalText(data.exclusions),
          referenceUrls: this.cleanStringList(data.referenceUrls ?? []),
          referenceAttachments: attachments,
          budgetType: data.budgetType,
          budgetMin: data.budgetMin.toFixed(2),
          budgetMax: data.budgetType === 'range' ? data.budgetMax?.toFixed(2) : null,
          deadline: data.deadline,
          estimatedDuration: data.estimatedDuration.trim(),
          workModality: data.workModality,
          workMethod: data.workMethod.trim(),
          milestones: (data.milestones ?? []).map((milestone) => ({
            title: milestone.title.trim(),
            dueDate: milestone.dueDate,
          })),
          initialMeetingProposedStartTimes: initialMeetingOptions.get(consultantId) ?? [],
          initialMeetingStartTime: null,
          details: this.cleanOptionalText(data.details),
          status: 'requested' as const,
          currency: process.env.MERCADO_PAGO_CURRENCY ?? 'PEN',
        })),
      );
      return created.map((item) => ({ ...item, meetings: [] }));
    } catch (error) {
      await this.deleteUploadedFiles(attachments.map((attachment) => attachment.storagePath));
      throw error;
    }
  }

  async sendProposal(id: number, data: ServiceRequestProposalDto, currentUser: User) {
    if (currentUser.role !== 'consultor') {
      throw new ForbiddenException('Solo el consultor asignado puede enviar una cotización');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'consultor');
    if (request.status !== 'requested') {
      throw new BadRequestException(['Esta solicitud ya fue respondida']);
    }

    const selectedInitialMeetingStartTime = data.selectedInitialMeetingStartTime
      ? this.normalizeDateTime(data.selectedInitialMeetingStartTime)
      : null;
    const proposedInitialMeetingStartTimes = request.initialMeetingProposedStartTimes ?? [];
    if (proposedInitialMeetingStartTimes.length && !selectedInitialMeetingStartTime) {
      throw new BadRequestException(['Selecciona uno de los horarios propuestos por la PYME']);
    }
    if (
      selectedInitialMeetingStartTime &&
      proposedInitialMeetingStartTimes.length &&
      !proposedInitialMeetingStartTimes.includes(selectedInitialMeetingStartTime)
    ) {
      throw new BadRequestException(['Selecciona uno de los horarios propuestos por la PYME']);
    }
    if (selectedInitialMeetingStartTime) {
      await this.consultantAvailabilityService.assertAvailableForMeeting(
        request.consultantId,
        new Date(selectedInitialMeetingStartTime),
        60,
      );
    }

    const updated = await this.serviceRequestRepository.update(
      id,
      {
        status: 'proposal_sent',
        proposedPrice: data.price.toFixed(2),
        proposalMessage: this.cleanOptionalText(data.message),
        initialMeetingStartTime: selectedInitialMeetingStartTime ? new Date(selectedInitialMeetingStartTime) : null,
        respondedAt: new Date(),
      },
      ['requested'],
    );
    if (!updated) throw new ConflictException('La solicitud fue actualizada por otro proceso');
    return updated;
  }

  async decline(id: number, data: ServiceRequestDeclineDto, currentUser: User) {
    const role = this.getParticipantRole(currentUser);
    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, role);
    const now = new Date();

    if (role === 'consultor') {
      if (request.status !== 'requested') {
        throw new BadRequestException(['Solo puedes rechazar una solicitud pendiente de respuesta']);
      }
      const updated = await this.serviceRequestRepository.update(
        id,
        {
          status: 'consultant_declined',
          proposalMessage: this.cleanOptionalText(data.message),
          respondedAt: now,
        },
        ['requested'],
      );
      if (!updated) throw new ConflictException('La solicitud fue actualizada por otro proceso');
      return updated;
    }

    if (request.status !== 'proposal_sent') {
      throw new BadRequestException(['Solo puedes rechazar una cotización que tenga un precio propuesto']);
    }
    const updated = await this.serviceRequestRepository.update(
      id,
      {
        status: 'pyme_declined',
        pymeDecisionMessage: this.cleanOptionalText(data.message),
        decidedAt: now,
      },
      ['proposal_sent'],
    );
    if (!updated) throw new ConflictException('La solicitud fue actualizada por otro proceso');
    return updated;
  }

  async findPayableForPyme(id: number, pymeId: number) {
    const request = await this.findOne(id);
    if (request.pymeId !== pymeId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud de servicio');
    }
    if (!['proposal_sent', 'payment_pending'].includes(request.status)) {
      throw new BadRequestException(['Esta cotización no está disponible para pago']);
    }
    const amount = Number(request.proposedPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException(['El consultor todavía no ha definido un precio válido']);
    }
    return request;
  }

  async markPaymentPending(id: number) {
    const request = await this.findOne(id);
    if (request.status === 'payment_pending') return request;
    const updated = await this.serviceRequestRepository.update(
      id,
      { status: 'payment_pending', decidedAt: new Date() },
      ['proposal_sent'],
    );
    if (!updated) throw new ConflictException('No se pudo actualizar el estado del servicio');
    return updated;
  }

  async markPaid(id: number) {
    const request = await this.findOne(id);
    if (request.status === 'paid') {
      await this.ensureInitialMeeting(request);
      return this.findOne(id);
    }
    const now = new Date();
    const updated = await this.serviceRequestRepository.update(
      id,
      { status: 'paid', decidedAt: request.decidedAt ?? now, paidAt: now },
      ['proposal_sent', 'payment_pending'],
    );
    if (!updated) throw new ConflictException('No se pudo confirmar el pago del servicio');
    await this.ensureInitialMeeting(updated);
    return this.findOne(id);
  }

  async scheduleMilestoneMeeting(id: number, data: ServiceRequestMilestoneMeetingDto, currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo la PYME puede proponer reuniones para los hitos');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'pyme');
    if (request.status !== 'paid') {
      throw new BadRequestException(['El servicio debe estar pagado antes de programar sus hitos']);
    }

    const milestone = request.milestones[data.milestoneIndex];
    if (!milestone) throw new NotFoundException('El hito indicado no existe');
    const existingMeeting = await this.meetingRepository.findByServiceRequestMilestone(id, data.milestoneIndex);
    if (existingMeeting) throw new ConflictException('Este hito ya tiene una reunión programada');

    const proposedStartTimes = this.cleanProposedStartTimes(data.proposedStartTimes);
    for (const proposedStartTime of proposedStartTimes) {
      await this.consultantAvailabilityService.assertAvailableForMeeting(
        request.consultantId,
        new Date(proposedStartTime),
        60,
      );
    }

    const createdMeeting = await this.meetingService.create({
      pymeId: request.pymeId,
      consultantId: request.consultantId,
      title: `${request.title} · ${milestone.title}`,
      proposedStartTimes,
      durationMinutes: 60,
      description: `Reunión de seguimiento del hito: ${milestone.title}`,
      requestedBy: 'pyme',
      meetingType: 'servicio',
      serviceRequestId: id,
      serviceMilestoneIndex: data.milestoneIndex,
    });
    await this.meetingService.markPaidPendingConfirmation(createdMeeting.id);
    return this.findOne(id);
  }

  private async findOne(id: number) {
    const request = await this.serviceRequestRepository.findOne(id);
    if (!request) throw new NotFoundException(`Service request with ID ${id} not found`);
    const meetings = await this.meetingRepository.findByServiceRequestId(id);
    return { ...request, meetings: meetings.map((meeting) => this.toMeetingResult(meeting)) };
  }

  private getParticipantRole(currentUser: User): 'pyme' | 'consultor' {
    if (currentUser.role === 'pyme' || currentUser.role === 'consultor') return currentUser.role;
    throw new ForbiddenException('Solo una PYME o un consultor puede acceder a servicios');
  }

  private assertParticipant(
    request: { pymeId: number; consultantId: number },
    userId: number,
    role: 'pyme' | 'consultor',
  ) {
    const participantId = role === 'pyme' ? request.pymeId : request.consultantId;
    if (participantId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud de servicio');
    }
  }

  private cleanOptionalText(value?: string) {
    const text = value?.trim();
    return text || null;
  }

  private cleanStringList(values: string[]) {
    return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  }

  private validateRequestDetails(data: ServiceRequestCreateDto) {
    const category = SERVICE_REQUEST_CATEGORY_OPTIONS.find((option) => option.category === data.category);
    if (!category?.subcategories.some((subcategory) => subcategory === data.subcategory.trim())) {
      throw new BadRequestException(['Selecciona una subcategoría válida para la categoría elegida']);
    }

    if (!data.deliverables.some((deliverable) => deliverable.trim().length >= 3)) {
      throw new BadRequestException(['Agrega al menos un entregable específico']);
    }

    if (data.budgetType === 'range') {
      if (data.budgetMax === undefined || data.budgetMax < data.budgetMin) {
        throw new BadRequestException(['El presupuesto máximo debe ser mayor o igual al mínimo']);
      }
    }

    const today = this.currentDateString();
    if (!this.isValidDateOnly(data.deadline) || data.deadline < today) {
      throw new BadRequestException(['La fecha límite no puede estar en el pasado']);
    }

    for (const milestone of data.milestones ?? []) {
      if (!this.isValidDateOnly(milestone.dueDate) || milestone.dueDate < today || milestone.dueDate > data.deadline) {
        throw new BadRequestException(['Cada hito debe tener una fecha válida entre hoy y la fecha límite']);
      }
    }
  }

  private async validateInitialMeetingOptions(data: ServiceRequestCreateDto, consultantIds: number[]) {
    const optionsByConsultant = new Map<number, string[]>();
    if (data.initialMeetingOptions.length !== consultantIds.length) {
      throw new BadRequestException(['Debes seleccionar 3 horarios para cada consultor elegido']);
    }

    for (const option of data.initialMeetingOptions) {
      if (!consultantIds.includes(option.consultantId) || optionsByConsultant.has(option.consultantId)) {
        throw new BadRequestException(['Los horarios iniciales no coinciden con los consultores elegidos']);
      }
      const proposedStartTimes = this.cleanProposedStartTimes(option.proposedStartTimes);
      this.validateInitialMeetingDateWindow(proposedStartTimes);
      for (const proposedStartTime of proposedStartTimes) {
        await this.consultantAvailabilityService.assertAvailableForMeeting(
          option.consultantId,
          new Date(proposedStartTime),
          60,
        );
      }
      optionsByConsultant.set(option.consultantId, proposedStartTimes);
    }

    return optionsByConsultant;
  }

  private async ensureInitialMeeting(request: NonNullable<Awaited<ReturnType<ServiceRequestRepository['findOne']>>>) {
    if (!request || !request.initialMeetingStartTime) return;
    const meetings = await this.meetingRepository.findByServiceRequestId(request.id);
    const hasInitialMeeting = meetings.some(
      (meeting) =>
        meeting.meetingType === 'servicio' &&
        meeting.serviceRequestId === request.id &&
        meeting.serviceMilestoneIndex === null,
    );
    if (hasInitialMeeting) return;

    try {
      const meeting = await this.meetingService.create({
        pymeId: request.pymeId,
        consultantId: request.consultantId,
        title: `${request.title} · Reunión inicial`,
        startTime: new Date(request.initialMeetingStartTime),
        durationMinutes: 60,
        description: `Reunión inicial del servicio: ${request.title}`,
        requestedBy: 'consultor',
        meetingType: 'servicio',
        serviceRequestId: request.id,
      });
      await this.meetingService.confirm(meeting.id);
      this.logger.log(`Reunión inicial de servicio ${request.id} creada como reunión ${meeting.id}`);
    } catch (error: unknown) {
      this.logger.error(
        `No se pudo crear la reunión inicial del servicio ${request.id}; el pago quedó confirmado`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private normalizeDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException(['El horario seleccionado no es válido']);
    return date.toISOString();
  }

  private cleanProposedStartTimes(values: string[]) {
    const normalized = values.map((value) => this.normalizeDateTime(value));
    const uniqueValues = [...new Set(normalized)];
    if (uniqueValues.length !== 3) throw new BadRequestException(['Selecciona exactamente 3 horarios diferentes']);
    const uniqueDays = new Set(uniqueValues.map((value) => this.dateStringInTimeZone(new Date(value), 'America/Lima')));
    if (uniqueDays.size !== 3) {
      throw new BadRequestException(['Selecciona horarios pertenecientes a 3 días diferentes']);
    }
    uniqueValues.sort((left, right) => new Date(left).getTime() - new Date(right).getTime());
    return uniqueValues;
  }

  private validateInitialMeetingDateWindow(values: string[]) {
    const { start, end } = this.initialMeetingDateWindow();
    const outsideAllowedWindow = values.some((value) => {
      const meetingDate = this.dateStringInTimeZone(new Date(value), 'America/Lima');
      return meetingDate < start || meetingDate > end;
    });

    if (outsideAllowedWindow) {
      throw new BadRequestException([
        'Los horarios de la reunión inicial deben pertenecer a la semana actual o a la próxima',
      ]);
    }
  }

  private initialMeetingDateWindow() {
    const todayValue = this.dateStringInTimeZone(new Date(), 'America/Lima');
    const [year, month, day] = todayValue.split('-').map(Number);
    const today = new Date(Date.UTC(year, month - 1, day));

    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() + 1);

    const monday = new Date(today);
    const daysSinceMonday = (monday.getUTCDay() + 6) % 7;
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);

    const end = new Date(monday);
    end.setUTCDate(end.getUTCDate() + 13);

    return {
      start: this.utcDateString(start),
      end: this.utcDateString(end),
    };
  }

  private dateStringInTimeZone(date: Date, timeZone: string) {
    const values: Record<string, string> = {};
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    for (const part of parts) {
      if (part.type !== 'literal') values[part.type] = part.value;
    }
    return `${values.year}-${values.month}-${values.day}`;
  }

  private utcDateString(date: Date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  private toMeetingResult<T extends { meetingUrl: string | null; teamsOnlineMeetingId: string | null }>(meeting: T) {
    const { meetingUrl, teamsOnlineMeetingId: _teamsOnlineMeetingId, ...result } = meeting;
    return { ...result, hasMeetingLink: Boolean(meetingUrl) };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private currentDateString() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private isValidDateOnly(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }

  private validateFiles(files: Express.Multer.File[]) {
    if (files.length > SERVICE_REQUEST_MAX_FILES) {
      throw new BadRequestException([`Solo puedes adjuntar hasta ${SERVICE_REQUEST_MAX_FILES} archivos`]);
    }
    for (const file of files) {
      if (!isAllowedServiceRequestFile(file.mimetype)) {
        throw new BadRequestException(['Uno de los archivos tiene un formato no permitido']);
      }
      if (file.size > SERVICE_REQUEST_MAX_FILE_BYTES) {
        throw new BadRequestException(['Cada archivo debe pesar como máximo 10 MB']);
      }
      if (!hasValidServiceRequestFileSignature(file)) {
        throw new BadRequestException(['Uno de los archivos no contiene un formato válido']);
      }
    }
  }

  private async deleteUploadedFiles(storagePaths: string[]) {
    const results = await Promise.allSettled(
      storagePaths.map((storagePath) => this.storageService.delete(storagePath)),
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `No se pudo eliminar el adjunto temporal ${storagePaths[index]}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    });
  }
}
