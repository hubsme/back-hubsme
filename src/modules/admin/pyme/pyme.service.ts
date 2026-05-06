import { Injectable, NotFoundException } from '@nestjs/common';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';

@Injectable()
export class PymeService {
  constructor(private readonly pymeRepository: PymeRepository) {}

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

  private clean<T extends Partial<PymeCreateDto>>(data: T): T {
    return {
      ...data,
      name: data.name?.trim(),
      ruc: data.ruc?.trim(),
      sector: data.sector?.trim(),
      description: data.description?.trim(),
    };
  }
}
