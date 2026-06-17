import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { handleDbError } from '@functions/db-error.function';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantDTO } from '@db/tables/consultant.table';

@Injectable()
export class ConsultantService {
  constructor(private readonly consultantRepository: ConsultantRepository) {}

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

  private clean<T extends Partial<ConsultantCreateDto>>(data: T): Partial<ConsultantDTO> {
    return {
      ...data,
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      fullName: this.buildFullName(data),
      bio: data.bio?.trim(),
      specialties: data.specialties?.map((item) => item.trim()).filter(Boolean),
      sectors: data.sectors?.map((item) => item.trim()).filter(Boolean),
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
}
