import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Checkout } from '@db/tables/checkout.table';
import {
  SERVICE_REQUEST_CATEGORY_OPTIONS,
  ServiceRequestEvidenceAttachment,
  ServiceRequestMilestone,
  ServiceRequestPaymentPlan,
  ServiceRequestReferenceAttachment,
} from '@db/tables/service-request.table';
import { User } from '@db/tables/user.table';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { CheckoutRepository } from '@repositories/checkout.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { ServiceRequestRepository } from '@repositories/service-request.repository';
import { ConsultantServiceOfferRepository } from '@repositories/consultant-service-offer.repository';
import { TaskRepository } from '@repositories/task.repository';
import { ServiceRequestCreateDto } from './dto/service-request-create.dto';
import { ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestMilestoneMeetingDto } from './dto/service-request-milestone-meeting.dto';
import {
  ServiceRequestEvidenceMultipartDto,
  ServiceRequestExtraMilestoneMeetingDto,
  ServiceRequestMilestoneUpdateDto,
} from './dto/service-request-progress.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';
import { StorageService } from '../../storage/storage.service';
import { ConsultantAvailabilityService } from '../consultant-availability/consultant-availability.service';
import { MeetingService } from '../meeting/meeting.service';
import { calculateServiceInstallmentAmounts } from './service-request-payment.util';
import {
  SERVICE_REQUEST_MAX_FILES,
  SERVICE_REQUEST_MAX_FILE_BYTES,
  hasValidServiceRequestFileSignature,
  isAllowedServiceRequestFile,
} from './service-request-upload.config';

const KICKOFF_MILESTONE_TITLE = 'Kickoff y alineamiento inicial';
const COMPLETION_MILESTONE_TITLE = 'Cierre y finalización del servicio';

@Injectable()
export class ServiceRequestService {
  private readonly logger = new Logger(ServiceRequestService.name);
  private readonly maximumEvidenceAttachments = 30;

  constructor(
    private readonly serviceRequestRepository: ServiceRequestRepository,
    private readonly consultantServiceOfferRepository: ConsultantServiceOfferRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly taskRepository: TaskRepository,
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
      data: data.map((item) => ({ ...item, meetings: [], paymentSchedule: [] })),
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
    if (request.status === 'paid' || request.status === 'completed') {
      await this.ensureInitialMeeting(request);
      return this.findOne(id);
    }
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
    if (data.sourceTaskId !== undefined) {
      await this.assertAvailableSourceTask(data.sourceTaskId, currentUser.id);
      if (consultantIds.length !== 1) {
        throw new BadRequestException(['Las solicitudes originadas en una tarea deben enviarse a un solo consultor']);
      }
    }
    if (data.serviceOfferId) {
      const offer = await this.consultantServiceOfferRepository.findOne(data.serviceOfferId);
      if (!offer?.isActive) throw new NotFoundException('La oferta seleccionada ya no está disponible');
      if (consultantIds.length !== 1 || consultantIds[0] !== offer.consultantId) {
        throw new BadRequestException(['La oferta solo puede solicitarse al consultor que la publicó']);
      }
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
        consultantIds.map((consultantId) => {
          const milestones = this.buildServiceMilestones(
            data.milestones,
            data.deadline,
            initialMeetingOptions.get(consultantId) ?? [],
          );
          return {
            pymeId: currentUser.id,
            consultantId,
            serviceOfferId: data.serviceOfferId,
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
            milestones,
            paymentPlan: this.normalizePaymentPlan(data.paymentPlan, milestones),
            initialMeetingProposedStartTimes: initialMeetingOptions.get(consultantId) ?? [],
            initialMeetingStartTime: null,
            details: this.cleanOptionalText(data.details),
            status: 'requested' as const,
            currency: process.env.MERCADO_PAGO_CURRENCY ?? 'PEN',
          };
        }),
        data.sourceTaskId,
      );
      if (!created) {
        throw new ConflictException('Esta tarea ya tiene una solicitud de servicio vinculada');
      }
      return created.map((item) => ({ ...item, meetings: [], paymentSchedule: [] }));
    } catch (error) {
      await this.deleteUploadedFiles(attachments.map((attachment) => attachment.storagePath));
      throw error;
    }
  }

  private async assertAvailableSourceTask(sourceTaskId: number, pymeId: number) {
    const sourceTask = await this.taskRepository.findOne(sourceTaskId);
    if (!sourceTask) throw new NotFoundException('La tarea seleccionada no existe');
    if (sourceTask.pymeId !== pymeId) {
      throw new ForbiddenException('No puedes solicitar un servicio desde una tarea de otra PYME');
    }
    if (sourceTask.serviceRequestId !== null) {
      throw new ConflictException('Esta tarea ya tiene una solicitud de servicio vinculada');
    }
    if (!sourceTask.meetingId) {
      throw new BadRequestException(['La tarea debe pertenecer a un acta de reunión']);
    }

    const sourceMeeting = await this.meetingRepository.findOne(sourceTask.meetingId);
    if (
      !sourceMeeting ||
      sourceMeeting.pymeId !== pymeId ||
      sourceMeeting.status !== 'finalizada' ||
      sourceMeeting.meetingType !== 'consultoria' ||
      !sourceMeeting.description?.trim()
    ) {
      throw new BadRequestException(['La tarea debe pertenecer a un acta finalizada de consultoría']);
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
        { enforceBookingNotice: false },
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
    return this.findOne(id);
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
      return this.findOne(id);
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
    return this.findOne(id);
  }

  async findPayableForPyme(id: number, pymeId: number) {
    const request = await this.findOne(id);
    if (request.pymeId !== pymeId) {
      throw new ForbiddenException('No tienes acceso a esta solicitud de servicio');
    }
    if (!['proposal_sent', 'payment_pending', 'paid'].includes(request.status)) {
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
    if (request.status === 'paid' || request.status === 'completed') {
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

  async completeService(id: number, currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo la PYME puede dar por completado el servicio');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'pyme');
    if (request.status === 'completed') return request;
    if (request.status !== 'paid') {
      throw new BadRequestException(['Solo puedes completar un servicio aprobado y pagado']);
    }
    if (request.paymentSchedule.some((installment) => installment.status !== 'approved')) {
      throw new BadRequestException(['Completa todas las cuotas antes de cerrar el servicio']);
    }

    const updated = await this.serviceRequestRepository.update(id, { status: 'completed', completedAt: new Date() }, [
      'paid',
    ]);
    if (!updated) throw new ConflictException('El estado del servicio cambió antes de completarlo');
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

  async updateMilestone(id: number, milestoneIndex: number, data: ServiceRequestMilestoneUpdateDto, currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo la PYME puede editar los hitos del servicio');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'pyme');
    if (request.status !== 'paid') {
      throw new BadRequestException(['Solo puedes editar hitos de un servicio pagado']);
    }
    if (milestoneIndex < 1 || milestoneIndex >= request.milestones.length - 1) {
      throw new BadRequestException(['El hito inicial y el hito final no son editables']);
    }

    const currentMilestone = request.milestones[milestoneIndex];
    if (!currentMilestone) throw new NotFoundException('El hito indicado no existe');
    if (request.meetings.some((meeting) => meeting.serviceMilestoneIndex === milestoneIndex)) {
      throw new ConflictException('No puedes editar un hito que ya tiene una reunión registrada');
    }

    const title = data.title.trim();
    if (title.length < 3) {
      throw new BadRequestException(['El nombre del hito debe tener al menos 3 caracteres']);
    }
    const today = this.dateStringInTimeZone(new Date(), 'America/Lima');
    if (!this.isValidDateOnly(data.dueDate) || data.dueDate < today) {
      throw new BadRequestException(['La fecha del hito no puede estar en el pasado']);
    }
    const previousMilestone = request.milestones[milestoneIndex - 1];
    const nextMilestone = request.milestones[milestoneIndex + 1];
    if (previousMilestone && data.dueDate < previousMilestone.dueDate) {
      throw new BadRequestException([`La fecha debe ser igual o posterior a ${previousMilestone.dueDate}`]);
    }
    if (nextMilestone && data.dueDate > nextMilestone.dueDate) {
      throw new BadRequestException([`La fecha debe ser igual o anterior a ${nextMilestone.dueDate}`]);
    }
    if (request.deadline && data.dueDate > request.deadline) {
      throw new BadRequestException(['La fecha del hito no puede superar la fecha límite del servicio']);
    }

    const updated = await this.serviceRequestRepository.updateMilestone(
      id,
      milestoneIndex,
      { title, dueDate: data.dueDate },
      request.milestones.length,
    );
    if (!updated) {
      throw new ConflictException('El hito ya fue actualizado o recibió una reunión');
    }
    return this.findOne(id);
  }

  async removeMilestone(id: number, milestoneIndex: number, currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo la PYME puede eliminar hitos del servicio');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'pyme');
    if (request.status !== 'paid') {
      throw new BadRequestException(['Solo puedes eliminar hitos de un servicio pagado']);
    }
    if (milestoneIndex < 1 || milestoneIndex >= request.milestones.length - 1) {
      throw new BadRequestException(['El hito inicial y el hito final no se pueden eliminar']);
    }
    if (!request.milestones[milestoneIndex]) {
      throw new NotFoundException('El hito indicado no existe');
    }
    if (request.meetings.some((meeting) => meeting.serviceMilestoneIndex === milestoneIndex)) {
      throw new ConflictException('No puedes eliminar un hito que ya tiene una reunión registrada');
    }
    if (request.evidenceAttachments.some((attachment) => attachment.milestoneIndex === milestoneIndex)) {
      throw new BadRequestException(['Elimina primero las evidencias vinculadas a este hito']);
    }
    if (request.paymentPlan.installments.some((installment) => installment.milestoneIndex === milestoneIndex)) {
      throw new BadRequestException(['No puedes eliminar un hito vinculado al plan de pagos']);
    }

    const removed = await this.serviceRequestRepository.removeMilestoneAt(
      id,
      milestoneIndex,
      request.milestones.length,
    );
    if (!removed) {
      throw new ConflictException('El hito ya fue actualizado o recibió una reunión');
    }
    return this.findOne(id);
  }

  async addExtraMilestoneMeeting(id: number, data: ServiceRequestExtraMilestoneMeetingDto, currentUser: User) {
    if (currentUser.role !== 'pyme') {
      throw new ForbiddenException('Solo la PYME puede agregar hitos al servicio');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'pyme');
    if (request.status !== 'paid') {
      throw new BadRequestException(['El servicio debe estar pagado antes de agregar un hito']);
    }
    if (request.milestones.length >= 20) {
      throw new BadRequestException(['El servicio alcanzó el máximo de 20 hitos']);
    }
    if (request.milestones.length < 2) {
      throw new BadRequestException([
        'El servicio necesita un hito inicial y uno final antes de agregar etapas intermedias',
      ]);
    }

    const milestoneIndex = data.insertAtIndex;
    if (milestoneIndex < 1 || milestoneIndex >= request.milestones.length) {
      throw new BadRequestException(['El nuevo hito debe ubicarse entre el hito inicial y el final']);
    }

    const title = data.title.trim();
    const today = this.dateStringInTimeZone(new Date(), 'America/Lima');
    if (!this.isValidDateOnly(data.dueDate) || data.dueDate < today) {
      throw new BadRequestException(['La fecha del hito no puede estar en el pasado']);
    }
    if (request.deadline && data.dueDate > request.deadline) {
      throw new BadRequestException(['La fecha del hito no puede superar la fecha límite del servicio']);
    }
    const previousMilestone = request.milestones[milestoneIndex - 1];
    const nextMilestone = request.milestones[milestoneIndex];
    if (data.dueDate < previousMilestone.dueDate || data.dueDate > nextMilestone.dueDate) {
      throw new BadRequestException([
        `La fecha debe estar entre ${previousMilestone.dueDate} y ${nextMilestone.dueDate}`,
      ]);
    }

    const proposedStartTimes = this.cleanProposedStartTimes(data.proposedStartTimes);
    const meetingAfterMilestone = proposedStartTimes.some(
      (value) => this.dateStringInTimeZone(new Date(value), 'America/Lima') > data.dueDate,
    );
    if (meetingAfterMilestone) {
      throw new BadRequestException(['Los horarios propuestos deben ser anteriores o iguales a la fecha del hito']);
    }
    for (const proposedStartTime of proposedStartTimes) {
      await this.consultantAvailabilityService.assertAvailableForMeeting(
        request.consultantId,
        new Date(proposedStartTime),
        60,
      );
    }

    const milestone = { title, dueDate: data.dueDate };
    const inserted = await this.serviceRequestRepository.insertMilestoneAt(
      id,
      milestoneIndex,
      milestone,
      request.milestones.length,
    );
    if (!inserted) {
      throw new ConflictException('El plan de hitos cambió mientras agregabas la nueva etapa');
    }

    try {
      const meeting = await this.meetingService.create({
        pymeId: request.pymeId,
        consultantId: request.consultantId,
        title: `${request.title} · ${title}`,
        proposedStartTimes,
        durationMinutes: 60,
        description: `Reunión de seguimiento del hito adicional: ${title}`,
        requestedBy: 'pyme',
        meetingType: 'servicio',
        serviceRequestId: id,
        serviceMilestoneIndex: milestoneIndex,
      });
      await this.meetingService.markPaidPendingConfirmation(meeting.id);
    } catch (error) {
      await this.serviceRequestRepository.rollbackInsertedMilestone(id, milestoneIndex, milestone);
      throw error;
    }

    return this.findOne(id);
  }

  async uploadEvidence(
    id: number,
    data: ServiceRequestEvidenceMultipartDto,
    files: Express.Multer.File[],
    currentUser: User,
  ) {
    if (currentUser.role !== 'consultor') {
      throw new ForbiddenException('Solo el consultor puede adjuntar evidencias y entregables del servicio');
    }

    const role = 'consultor' as const;
    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, role);
    if (request.status !== 'paid') {
      throw new BadRequestException(['El servicio debe estar pagado para adjuntar evidencias']);
    }
    if (!files.length) {
      throw new BadRequestException(['Selecciona al menos un archivo']);
    }
    this.validateFiles(files);
    if (request.evidenceAttachments.length + files.length > this.maximumEvidenceAttachments) {
      throw new BadRequestException([
        `El servicio admite hasta ${this.maximumEvidenceAttachments} evidencias o entregables`,
      ]);
    }
    if (data.milestoneIndex !== undefined && !request.milestones[data.milestoneIndex]) {
      throw new NotFoundException('El hito seleccionado no existe');
    }

    const uploadedAttachments: ServiceRequestEvidenceAttachment[] = [];
    try {
      for (const file of files) {
        const uploaded = await this.storageService.upload(file, `service-requests/${id}/evidence/${randomUUID()}`);
        uploadedAttachments.push({
          id: randomUUID(),
          storagePath: uploaded.publicId,
          fileUrl: uploaded.secureUrl,
          originalName: file.originalname.slice(0, 255),
          mimeType: file.mimetype,
          sizeBytes: file.size,
          note: this.cleanOptionalText(data.note),
          milestoneIndex: data.milestoneIndex ?? null,
          uploadedAt: new Date().toISOString(),
          uploadedBy: currentUser.id,
          uploadedByRole: role,
        });
      }

      const updated = await this.serviceRequestRepository.update(
        id,
        { evidenceAttachments: [...request.evidenceAttachments, ...uploadedAttachments] },
        ['paid'],
      );
      if (!updated) throw new ConflictException('No se pudieron registrar los archivos del servicio');
    } catch (error) {
      await this.deleteUploadedFiles(uploadedAttachments.map((attachment) => attachment.storagePath));
      throw error;
    }

    return this.findOne(id);
  }

  async deleteEvidence(id: number, attachmentId: string, currentUser: User) {
    if (currentUser.role !== 'consultor') {
      throw new ForbiddenException('Solo el consultor puede eliminar evidencias y entregables del servicio');
    }

    const request = await this.findOne(id);
    this.assertParticipant(request, currentUser.id, 'consultor');
    if (request.status !== 'paid') {
      throw new BadRequestException(['Solo puedes eliminar evidencias de un servicio pagado']);
    }
    const attachment = request.evidenceAttachments.find((item) => item.id === attachmentId);
    if (!attachment) throw new NotFoundException('La evidencia indicada no existe');
    if (
      attachment.milestoneIndex !== null &&
      request.meetings.some((meeting) => meeting.serviceMilestoneIndex === attachment.milestoneIndex)
    ) {
      throw new ConflictException('No puedes eliminar evidencias de un hito que ya tiene una reunión registrada');
    }

    const removed = await this.serviceRequestRepository.removeEvidenceAttachment(id, attachmentId);
    if (!removed) throw new ConflictException('La evidencia ya fue eliminada o el servicio cambió');
    await this.deleteUploadedFiles([removed.storagePath]);
    return this.findOne(id);
  }

  private async findOne(id: number) {
    const request = await this.serviceRequestRepository.findOne(id);
    if (!request) throw new NotFoundException(`Service request with ID ${id} not found`);
    const [meetings, checkouts] = await Promise.all([
      this.meetingRepository.findByServiceRequestId(id),
      this.checkoutRepository.findAllByServiceRequestId(id),
    ]);
    const meetingResults = meetings.map((meeting) => this.toMeetingResult(meeting));
    return {
      ...request,
      meetings: meetingResults,
      paymentSchedule: this.buildPaymentSchedule(request, meetingResults, checkouts),
    };
  }

  private buildPaymentSchedule(
    request: NonNullable<Awaited<ReturnType<ServiceRequestRepository['findOne']>>>,
    meetings: Array<{ status: string; serviceMilestoneIndex: number | null }>,
    checkouts: Checkout[],
  ) {
    const totalPrice = Number(request.proposedPrice);
    const amounts = calculateServiceInstallmentAmounts(totalPrice, request.paymentPlan);
    const checkoutByInstallment = new Map(
      checkouts.flatMap((item) =>
        item.serviceInstallmentIndex === null ? [] : [[item.serviceInstallmentIndex, item] as const],
      ),
    );

    return request.paymentPlan.installments.map((installment, installmentIndex) => {
      const installmentCheckout = checkoutByInstallment.get(installmentIndex);
      const isApproved = installmentCheckout?.status === 'approved';
      const canPay = ['proposal_sent', 'payment_pending', 'paid'].includes(request.status);
      const available = !isApproved && request.status !== 'completed' && canPay;
      const availabilityMessage = !isApproved && !canPay ? 'Disponible cuando el consultor envíe su propuesta' : null;

      return {
        installmentIndex,
        ...installment,
        amount: amounts[installmentIndex]?.toFixed(2) ?? null,
        status: installmentCheckout?.status ?? ('not_started' as const),
        available,
        availabilityMessage,
        paidAt: isApproved ? installmentCheckout.updatedAt : null,
      };
    });
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

  private buildServiceMilestones(
    milestones: ServiceRequestCreateDto['milestones'],
    deadline: string,
    initialMeetingStartTimes: string[],
  ): ServiceRequestMilestone[] {
    const normalized = (milestones ?? []).map((milestone) => ({
      title: milestone.title.trim(),
      dueDate: milestone.dueDate,
    }));
    const kickoffMilestone = normalized.find((milestone) => this.isKickoffMilestoneTitle(milestone.title));
    const kickoffMeetingDate = initialMeetingStartTimes
      .map((value) => this.dateStringInTimeZone(new Date(value), 'America/Lima'))
      .sort()[0];
    const today = this.currentDateString();
    const kickoffDate = this.clampDateOnly(kickoffMeetingDate ?? kickoffMilestone?.dueDate ?? today, today, deadline);
    const intermediateMilestones = normalized
      .filter(
        (milestone) =>
          !this.isKickoffMilestoneTitle(milestone.title) && !this.isCompletionMilestoneTitle(milestone.title),
      )
      .map((milestone) => ({
        title: milestone.title,
        dueDate: this.clampDateOnly(milestone.dueDate, kickoffDate, deadline),
      }))
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .slice(0, 18);

    return [
      { title: KICKOFF_MILESTONE_TITLE, dueDate: kickoffDate },
      ...intermediateMilestones,
      { title: COMPLETION_MILESTONE_TITLE, dueDate: deadline },
    ];
  }

  private normalizePaymentPlan(
    paymentPlan: ServiceRequestCreateDto['paymentPlan'],
    milestones: ServiceRequestMilestone[],
  ): ServiceRequestPaymentPlan {
    const finalMilestoneIndex = milestones.length - 1;
    const installments = paymentPlan.installments.map((installment) => ({
      label: installment.label.trim(),
      percentage: installment.percentage,
      trigger: installment.trigger,
      milestoneIndex: installment.milestoneIndex,
    }));
    const totalPercentage = installments.reduce((total, installment) => total + installment.percentage, 0);
    const milestoneIndexes = installments.map((installment) => installment.milestoneIndex);

    if (!paymentPlan.summary.trim() || !paymentPlan.rationale.trim()) {
      throw new BadRequestException(['El plan de pagos debe incluir un resumen y su justificación']);
    }
    if (totalPercentage !== 100 || installments.some((installment) => installment.percentage < 10)) {
      throw new BadRequestException(['Las cuotas deben sumar 100% y cada una debe representar al menos 10%']);
    }
    if (
      installments.some(
        (installment) =>
          !installment.label || installment.milestoneIndex < 0 || installment.milestoneIndex > finalMilestoneIndex,
      ) ||
      new Set(milestoneIndexes).size !== milestoneIndexes.length ||
      milestoneIndexes.some((milestoneIndex, index) => index > 0 && milestoneIndex <= milestoneIndexes[index - 1])
    ) {
      throw new BadRequestException(['Las cuotas deben vincularse una sola vez y en orden a hitos válidos']);
    }

    const firstInstallment = installments[0];
    const lastInstallment = installments.at(-1);
    if (firstInstallment?.milestoneIndex !== 0 || firstInstallment.trigger !== 'service_approval') {
      throw new BadRequestException(['La primera cuota debe corresponder a la aprobación e inicio del servicio']);
    }

    if (paymentPlan.strategy === 'single') {
      if (installments.length !== 1 || firstInstallment.percentage !== 100) {
        throw new BadRequestException(['El pago único debe contener una sola cuota del 100%']);
      }
    } else {
      if (
        !lastInstallment ||
        lastInstallment.milestoneIndex !== finalMilestoneIndex ||
        lastInstallment.trigger !== 'service_completion'
      ) {
        throw new BadRequestException(['El plan fraccionado debe reservar una cuota para el cierre del servicio']);
      }
      if (installments.slice(1, -1).some((installment) => installment.trigger !== 'milestone_completion')) {
        throw new BadRequestException(['Las cuotas intermedias deben depender de la conclusión de su hito']);
      }
    }

    if (paymentPlan.strategy === 'initial_final' && installments.length !== 2) {
      throw new BadRequestException(['El plan inicial y final debe contener exactamente dos cuotas']);
    }
    if (paymentPlan.strategy === 'milestone_installments' && installments.length < 3) {
      throw new BadRequestException(['El pago por hitos debe contener una cuota inicial, una intermedia y una final']);
    }

    return {
      strategy: paymentPlan.strategy,
      summary: paymentPlan.summary.trim(),
      rationale: paymentPlan.rationale.trim(),
      installments,
    };
  }

  private isKickoffMilestoneTitle(title: string) {
    return /kickoff|reunion inicial|inicio del servicio|presentacion|alineamiento inicial|arranque inicial/i.test(
      this.normalizeForComparison(title),
    );
  }

  private isCompletionMilestoneTitle(title: string) {
    return /reunion final|cierre del servicio|finalizacion del servicio|entrega final|culminacion/i.test(
      this.normalizeForComparison(title),
    );
  }

  private normalizeForComparison(value: string) {
    return value
      .toLocaleLowerCase('es-PE')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private clampDateOnly(value: string, minimum: string, maximum: string) {
    if (value < minimum) return minimum;
    if (value > maximum) return maximum;
    return value;
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
    const initialMeetingTitle = `${request.title} · Reunión inicial`;
    const initialMeeting = meetings.find(
      (meeting) =>
        meeting.meetingType === 'servicio' &&
        meeting.serviceRequestId === request.id &&
        meeting.title === initialMeetingTitle,
    );
    if (initialMeeting) {
      if (initialMeeting.serviceMilestoneIndex === null) {
        try {
          await this.meetingRepository.update(initialMeeting.id, { serviceMilestoneIndex: 0 });
        } catch (error: unknown) {
          this.logger.error(
            `No se pudo vincular la reunión inicial ${initialMeeting.id} con el hito 0 del servicio ${request.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
      return;
    }

    const hasInitialMeeting = meetings.some(
      (meeting) =>
        meeting.meetingType === 'servicio' &&
        meeting.serviceRequestId === request.id &&
        meeting.serviceMilestoneIndex === null,
    );
    if (hasInitialMeeting) return;

    try {
      const meeting = await this.meetingService.create(
        {
          pymeId: request.pymeId,
          consultantId: request.consultantId,
          title: initialMeetingTitle,
          startTime: new Date(request.initialMeetingStartTime),
          durationMinutes: 60,
          description: `Reunión inicial del servicio: ${request.title}`,
          requestedBy: 'consultor',
          meetingType: 'servicio',
          serviceRequestId: request.id,
          serviceMilestoneIndex: 0,
        },
        false,
      );
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
