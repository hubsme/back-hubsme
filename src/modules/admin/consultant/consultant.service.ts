import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantMeetingPymesFiltersDto } from './dto/consultant-meeting-pymes.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantDTO } from '@db/tables/consultant.table';

@Injectable()
export class ConsultantService {
  constructor(
    private readonly consultantRepository: ConsultantRepository,
    private readonly pymeRepository: PymeRepository,
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
      const validated = (cleanData.photoUrl && cleanData.videoUrl) ? 'true' : 'false';
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
      const validated = (photoUrl && videoUrl) ? 'true' : 'false';
      
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
