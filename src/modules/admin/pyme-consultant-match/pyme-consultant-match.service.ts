import { Injectable, NotFoundException } from '@nestjs/common';
import { PymeConsultantMatchDTO } from '@db/tables/pyme-consultant-match.table';
import { handleDbError } from '@functions/db-error.function';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMatchCreateDto } from './dto/pyme-consultant-match-create.dto';
import { PymeConsultantMatchListFiltersDto } from './dto/pyme-consultant-match-list.dto';
import { PymeConsultantMatchUpdateDto } from './dto/pyme-consultant-match-update.dto';

@Injectable()
export class PymeConsultantMatchService {
  constructor(private readonly matchRepository: PymeConsultantMatchRepository) {}

  async findAllPaginated(filters: PymeConsultantMatchListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.matchRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const match = await this.matchRepository.findOne(id);
    if (!match) throw new NotFoundException(`Match with ID ${id} not found`);
    return match;
  }

  async create(data: PymeConsultantMatchCreateDto) {
    try {
      return await this.matchRepository.create(this.clean(data) as PymeConsultantMatchDTO);
    } catch (error: unknown) {
      handleDbError(error);
    }
  }

  async update(id: number, data: PymeConsultantMatchUpdateDto) {
    await this.findOne(id);
    try {
      return await this.matchRepository.update(id, this.clean(data));
    } catch (error: unknown) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.matchRepository.delete(id);
  }

  private clean(data: PymeConsultantMatchCreateDto | PymeConsultantMatchUpdateDto) {
    return {
      ...data,
      source: data.source?.trim(),
      notes: data.notes?.trim(),
    };
  }
}
