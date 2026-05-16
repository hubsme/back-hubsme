import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { handleDbError } from '@functions/db-error.function';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';
import { ConsultantPymeActionDto, ConsultantPymeMessageActionDto } from './dto/consultant-pyme-action.dto';
import { ConsultantPymeListFiltersDto, ConsultantPymeMessageListFiltersDto } from './dto/consultant-pyme-list.dto';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantDTO } from '@db/tables/consultant.table';

@Injectable()
export class ConsultantService {
  constructor(
    private readonly consultantRepository: ConsultantRepository,
    private readonly matchRepository: PymeConsultantMatchRepository,
    private readonly messageRepository: PymeConsultantMessageRepository,
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

  async create(data: ConsultantCreateDto) {
    try {
      return await this.consultantRepository.create(this.clean(data) as ConsultantDTO);
    } catch (error) {
      handleDbError(error);
    }
  }

  async update(id: number, data: ConsultantUpdateDto) {
    await this.findOne(id);
    try {
      return await this.consultantRepository.update(id, this.clean(data));
    } catch (error) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.consultantRepository.delete(id);
  }

  async contactPyme(data: ConsultantPymeActionDto) {
    const current = await this.matchRepository.findByPair(data.pymeId, data.consultantId);
    if (current) return current;

    try {
      return await this.matchRepository.create({
        pymeId: data.pymeId,
        consultantId: data.consultantId,
        status: 'pendiente',
        source: 'consultor',
        notes: data.notes?.trim(),
      });
    } catch (error) {
      handleDbError(error);
    }
  }

  async listPymeContacts(filters: ConsultantPymeListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.matchRepository.findAllPaginated(page, limit, {
      consultantId: filters.consultantId,
      status: filters.status,
      search: filters.search?.trim(),
    });
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async acceptPymeContact(data: ConsultantPymeActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    return this.matchRepository.update(match.id, { status: 'aceptado', notes: data.notes?.trim() });
  }

  async rejectPymeContact(data: ConsultantPymeActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    return this.matchRepository.update(match.id, { status: 'rechazado', notes: data.notes?.trim() });
  }

  async listPymeMessages(filters: ConsultantPymeMessageListFiltersDto) {
    const match = await this.findPair(filters.pymeId, filters.consultantId);
    if (match.status !== 'aceptado') {
      throw new BadRequestException(['El inbox se habilita cuando el match esta aceptado']);
    }

    return { data: await this.messageRepository.findAllByMatch(match.id) };
  }

  async sendPymeMessage(data: ConsultantPymeMessageActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    if (match.status !== 'aceptado') {
      throw new BadRequestException(['El inbox se habilita cuando el match esta aceptado']);
    }

    return this.messageRepository.create({
      matchId: match.id,
      senderId: data.consultantId,
      message: data.message.trim(),
    });
  }

  private async findPair(pymeId: number, consultantId: number) {
    const match = await this.matchRepository.findByPair(pymeId, consultantId);
    if (!match) throw new NotFoundException(`Match for PYME ${pymeId} and consultant ${consultantId} not found`);
    return match;
  }

  private clean<T extends Partial<ConsultantCreateDto>>(data: T): Partial<ConsultantDTO> {
    return {
      ...data,
      name: data.name?.trim(),
      bio: data.bio?.trim(),
      specialties: data.specialties?.map((item) => item.trim()).filter(Boolean),
      sectors: data.sectors?.map((item) => item.trim()).filter(Boolean),
      photoUrl: data.photoUrl?.trim(),
      videoUrl: data.videoUrl?.trim(),
      pricePerHour: data.pricePerHour === undefined ? undefined : data.pricePerHour.toFixed(2),
    };
  }
}
