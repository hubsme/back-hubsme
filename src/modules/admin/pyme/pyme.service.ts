import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { PymeConsultantActionDto, PymeConsultantMessageActionDto } from './dto/pyme-consultant-action.dto';
import { PymeConsultantListFiltersDto, PymeConsultantMessageListFiltersDto } from './dto/pyme-consultant-list.dto';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';

@Injectable()
export class PymeService {
  constructor(
    private readonly pymeRepository: PymeRepository,
    private readonly matchRepository: PymeConsultantMatchRepository,
    private readonly messageRepository: PymeConsultantMessageRepository,
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
      return await this.pymeRepository.create(this.clean(data));
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

  async contactConsultant(data: PymeConsultantActionDto) {
    const current = await this.matchRepository.findByPair(data.pymeId, data.consultantId);
    if (current) return current;

    try {
      return await this.matchRepository.create({
        pymeId: data.pymeId,
        consultantId: data.consultantId,
        status: 'pendiente',
        source: 'pyme',
        notes: data.notes?.trim(),
      });
    } catch (error) {
      handleDbError(error);
    }
  }

  async listConsultantContacts(filters: PymeConsultantListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.matchRepository.findAllPaginated(page, limit, {
      pymeId: filters.pymeId,
      status: filters.status,
      search: filters.search?.trim(),
    });
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async acceptConsultantContact(data: PymeConsultantActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    return this.matchRepository.update(match.id, { status: 'aceptado', notes: data.notes?.trim() });
  }

  async rejectConsultantContact(data: PymeConsultantActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    return this.matchRepository.update(match.id, { status: 'rechazado', notes: data.notes?.trim() });
  }

  async listConsultantMessages(filters: PymeConsultantMessageListFiltersDto) {
    const match = await this.findPair(filters.pymeId, filters.consultantId);
    if (match.status !== 'aceptado') {
      throw new BadRequestException(['El inbox se habilita cuando el match esta aceptado']);
    }

    return { data: await this.messageRepository.findAllByMatch(match.id) };
  }

  async sendConsultantMessage(data: PymeConsultantMessageActionDto) {
    const match = await this.findPair(data.pymeId, data.consultantId);
    if (match.status !== 'aceptado') {
      throw new BadRequestException(['El inbox se habilita cuando el match esta aceptado']);
    }

    return this.messageRepository.create({
      matchId: match.id,
      senderId: data.pymeId,
      message: data.message.trim(),
    });
  }

  private async findPair(pymeId: number, consultantId: number) {
    const match = await this.matchRepository.findByPair(pymeId, consultantId);
    if (!match) throw new NotFoundException(`Match for PYME ${pymeId} and consultant ${consultantId} not found`);
    return match;
  }

  private clean<T extends Partial<PymeCreateDto>>(data: T): T {
    return {
      ...data,
      name: data.name?.trim(),
      ruc: data.ruc?.trim(),
      sector: data.sector?.trim(),
      description: data.description?.trim(),
      logoUrl: data.logoUrl?.trim(),
    };
  }
}
