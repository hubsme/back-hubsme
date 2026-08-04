import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@db/tables/user.table';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ServiceRequestRepository } from '@repositories/service-request.repository';
import { ServiceRequestCreateDto } from './dto/service-request-create.dto';
import { ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly serviceRequestRepository: ServiceRequestRepository,
    private readonly consultantRepository: ConsultantRepository,
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
      data,
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

  async create(data: ServiceRequestCreateDto, currentUser: User) {
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

    const title = data.title.trim();
    const description = data.description.trim();
    const requirements = data.requirements.trim();
    if (title.length < 3 || description.length < 10 || requirements.length < 5) {
      throw new BadRequestException(['Completa el título, la descripción y los requerimientos con información válida']);
    }

    return this.serviceRequestRepository.createMany(
      consultantIds.map((consultantId) => ({
        pymeId: currentUser.id,
        consultantId,
        title,
        description,
        requirements,
        details: this.cleanOptionalText(data.details),
        status: 'requested' as const,
        currency: process.env.MERCADO_PAGO_CURRENCY ?? 'PEN',
      })),
    );
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

    const updated = await this.serviceRequestRepository.update(
      id,
      {
        status: 'proposal_sent',
        proposedPrice: data.price.toFixed(2),
        proposalMessage: this.cleanOptionalText(data.message),
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
    if (request.status === 'paid') return request;
    const now = new Date();
    const updated = await this.serviceRequestRepository.update(
      id,
      { status: 'paid', decidedAt: request.decidedAt ?? now, paidAt: now },
      ['proposal_sent', 'payment_pending'],
    );
    if (!updated) throw new ConflictException('No se pudo confirmar el pago del servicio');
    return updated;
  }

  private async findOne(id: number) {
    const request = await this.serviceRequestRepository.findOne(id);
    if (!request) throw new NotFoundException(`Service request with ID ${id} not found`);
    return request;
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
}
