import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantAvailabilityDTO } from '@db/tables/consultant-availability.table';
import { handleDbError } from '@functions/db-error.function';
import { ConsultantAvailabilityRepository } from '@repositories/consultant-availability.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantAvailabilityCreateDto } from './dto/consultant-availability-create.dto';
import {
  ConsultantAvailabilityListFiltersDto,
  ConsultantAvailabilityMonthFiltersDto,
} from './dto/consultant-availability-list.dto';
import { ConsultantAvailabilityReplaceMonthDto } from './dto/consultant-availability-replace-month.dto';
import { ConsultantAvailabilityUpdateDto } from './dto/consultant-availability-update.dto';

@Injectable()
export class ConsultantAvailabilityService {
  constructor(
    private readonly availabilityRepository: ConsultantAvailabilityRepository,
    private readonly consultantRepository: ConsultantRepository,
  ) {}

  async findAllPaginated(filters: ConsultantAvailabilityListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.availabilityRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const availability = await this.availabilityRepository.findOne(id);
    if (!availability) throw new NotFoundException(`Availability slot with ID ${id} not found`);
    return availability;
  }

  async findMonth(filters: ConsultantAvailabilityMonthFiltersDto) {
    const { startFrom, startTo } = this.getMonthRange(filters.year, filters.month);
    return {
      data: await this.availabilityRepository.findByRange(filters.consultantId, startFrom, startTo, filters.status),
    };
  }

  async findVisibleMonth(filters: ConsultantAvailabilityMonthFiltersDto) {
    const { startFrom, startTo } = this.getMonthRange(filters.year, filters.month);
    const slots = await this.availabilityRepository.findByRange(filters.consultantId, startFrom, startTo, 'disponible');
    const meetings = await this.availabilityRepository.findMeetingConflicts(filters.consultantId, startFrom, startTo);

    return {
      data: slots.filter(
        (slot) =>
          !meetings.some((meeting) =>
            this.overlaps(slot.startTime, slot.endTime, meeting.startTime, this.getMeetingEndTime(meeting)),
          ),
      ),
    };
  }

  async create(data: ConsultantAvailabilityCreateDto) {
    await this.validateConsultant(data.consultantId);
    await this.validateSlot(data);

    try {
      return await this.availabilityRepository.create(this.clean(data));
    } catch (error) {
      handleDbError(error);
    }
  }

  async replaceMonth(data: ConsultantAvailabilityReplaceMonthDto) {
    await this.validateConsultant(data.consultantId);
    const { startFrom, startTo } = this.getMonthRange(data.year, data.month);
    await this.validateMonthSlots(data, startFrom, startTo);

    try {
      await this.availabilityRepository.deleteByRange(data.consultantId, startFrom, startTo);
      const slots = data.slots.map((slot) => this.clean({ ...slot, consultantId: data.consultantId }));
      return { data: await this.availabilityRepository.createMany(slots) };
    } catch (error) {
      handleDbError(error);
    }
  }

  async update(id: number, data: ConsultantAvailabilityUpdateDto) {
    const current = await this.findOne(id);
    const merged = {
      consultantId: data.consultantId ?? current.consultantId,
      startTime: data.startTime ?? current.startTime,
      endTime: data.endTime ?? current.endTime,
      status: data.status ?? current.status,
      notes: data.notes ?? current.notes ?? undefined,
    };

    await this.validateConsultant(merged.consultantId);
    await this.validateSlot(merged, id);

    try {
      return await this.availabilityRepository.update(id, this.clean(merged));
    } catch (error) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.availabilityRepository.delete(id);
  }

  async assertAvailableForMeeting(consultantId: number, startTime: Date, durationMinutes: number) {
    await this.validateConsultant(consultantId);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const slot = await this.availabilityRepository.findCoveringSlot(consultantId, startTime, endTime);
    if (!slot) {
      throw new BadRequestException(['El consultor no tiene disponibilidad registrada para el horario seleccionado']);
    }

    const conflicts = await this.availabilityRepository.findMeetingConflicts(consultantId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new BadRequestException(['El horario seleccionado ya esta ocupado por otra reunion']);
    }
  }

  private async validateConsultant(consultantId: number) {
    const consultant = await this.consultantRepository.findByUserId(consultantId);
    if (!consultant) {
      throw new NotFoundException(`Consultant profile for user ID ${consultantId} not found`);
    }
  }

  private async validateSlot(data: ConsultantAvailabilityCreateDto, excludeId?: number) {
    if (data.endTime <= data.startTime) {
      throw new BadRequestException(['La hora final debe ser mayor que la hora inicial']);
    }

    const overlapping = await this.availabilityRepository.findOverlappingAvailability(
      data.consultantId,
      data.startTime,
      data.endTime,
      excludeId,
    );
    if (overlapping) {
      throw new BadRequestException(['El horario se cruza con otro bloque de disponibilidad del consultor']);
    }
  }

  private async validateMonthSlots(data: ConsultantAvailabilityReplaceMonthDto, startFrom: Date, startTo: Date) {
    const slots = [...data.slots].sort((left, right) => left.startTime.getTime() - right.startTime.getTime());

    for (const slot of slots) {
      if (slot.consultantId !== data.consultantId) {
        throw new BadRequestException(['Todos los horarios deben pertenecer al consultor indicado']);
      }

      if (slot.startTime < startFrom || slot.startTime > startTo || slot.endTime < startFrom || slot.endTime > startTo) {
        throw new BadRequestException(['Todos los horarios deben pertenecer al mes indicado']);
      }

      if (slot.endTime <= slot.startTime) {
        throw new BadRequestException(['La hora final debe ser mayor que la hora inicial']);
      }
    }

    for (let index = 1; index < slots.length; index += 1) {
      if (this.overlaps(slots[index - 1].startTime, slots[index - 1].endTime, slots[index].startTime, slots[index].endTime)) {
        throw new BadRequestException(['Existen horarios solapados en la agenda enviada']);
      }
    }
  }

  private clean(data: ConsultantAvailabilityCreateDto): ConsultantAvailabilityDTO {
    return {
      consultantId: data.consultantId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status ?? 'disponible',
      notes: data.notes?.trim(),
    };
  }

  private getMonthRange(year: number, month: number) {
    const startFrom = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const startTo = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    startTo.setMilliseconds(startTo.getMilliseconds() - 1);
    return { startFrom, startTo };
  }

  private getMeetingEndTime(meeting: { startTime: Date; durationMinutes: number }) {
    return new Date(meeting.startTime.getTime() + meeting.durationMinutes * 60 * 1000);
  }

  private overlaps(firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date) {
    return firstStart < secondEnd && firstEnd > secondStart;
  }
}
