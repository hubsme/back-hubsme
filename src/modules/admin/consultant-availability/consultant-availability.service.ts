import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ConsultantAvailability,
  ConsultantAvailabilitySchedule,
} from '@db/tables/consultant-availability.table';
import { handleDbError } from '@functions/db-error.function';
import { ConsultantAvailabilityRepository } from '@repositories/consultant-availability.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantGoogleCalendarService } from '../consultant-google-calendar/consultant-google-calendar.service';
import { ConsultantAvailabilityCreateDto } from './dto/consultant-availability-create.dto';
import {
  ConsultantAvailabilityListFiltersDto,
  ConsultantAvailabilityMonthFiltersDto,
} from './dto/consultant-availability-list.dto';
import { ConsultantAvailabilityReplaceMonthDto } from './dto/consultant-availability-replace-month.dto';
import { ConsultantAvailabilityUpdateDto } from './dto/consultant-availability-update.dto';

type MeetingConflict = {
  id: number;
  startTime: Date;
  durationMinutes: number;
  status: string;
};

type BusyConflict = {
  startTime: Date | string;
  endTime: Date | string;
};

@Injectable()
export class ConsultantAvailabilityService {
  private readonly halfHourMinutes = 30;
  private readonly businessTimezoneOffsetMinutes = -5 * 60;

  constructor(
    private readonly availabilityRepository: ConsultantAvailabilityRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly googleCalendarService: ConsultantGoogleCalendarService,
  ) {}

  async findAllPaginated(filters: ConsultantAvailabilityListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.availabilityRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((availability) => this.cleanAvailability(availability)),
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const availability = await this.availabilityRepository.findOne(id);
    if (!availability) throw new NotFoundException(`Availability month with ID ${id} not found`);
    return this.cleanAvailability(availability);
  }

  async findMonth(filters: ConsultantAvailabilityMonthFiltersDto) {
    const month = this.getMonthStart(filters.year, filters.month);
    const availability = await this.availabilityRepository.findByMonth(filters.consultantId, month);

    return {
      data: availability ? [this.cleanAvailability(availability)] : [],
    };
  }

  async findVisibleMonth(filters: ConsultantAvailabilityMonthFiltersDto) {
    const { startFrom, startTo } = this.getMonthRange(filters.year, filters.month);
    const month = this.getMonthStart(filters.year, filters.month);
    const availability = await this.availabilityRepository.findByMonth(filters.consultantId, month);
    const meetings = await this.availabilityRepository.findMeetingConflicts(filters.consultantId, startFrom, startTo);
    const googleBusySlots = await this.findGoogleBusyMonth(filters.consultantId, filters.year, filters.month);

    if (!availability) return { data: [] };

    const busySlots = [
      ...meetings.map((meeting) => ({
        startTime: meeting.startTime,
        endTime: this.getMeetingEndTime(meeting),
      })),
      ...googleBusySlots,
    ];

    return {
      data: [
        {
          ...this.cleanAvailability(availability),
          availableSchedule: this.removeBusyConflictsFromSchedule(availability.availableSchedule, month, busySlots),
        },
      ],
    };
  }

  async create(data: ConsultantAvailabilityCreateDto) {
    await this.validateConsultant(data.consultantId);
    const month = this.getMonthStartFromDate(new Date(data.month));
    const normalizedSchedule = this.normalizeSchedule(data.availableSchedule, month);

    try {
      const saved = await this.availabilityRepository.upsertMonth(data.consultantId, month, normalizedSchedule);
      return this.cleanAvailability(saved);
    } catch (error) {
      handleDbError(error);
    }
  }

  async replaceMonth(data: ConsultantAvailabilityReplaceMonthDto) {
    await this.validateConsultant(data.consultantId);
    const month = this.getMonthStart(data.year, data.month);
    const normalizedSchedule = this.normalizeSchedule(data.availableSchedule, month);

    try {
      const saved = await this.availabilityRepository.upsertMonth(data.consultantId, month, normalizedSchedule);
      return { data: [this.cleanAvailability(saved)] };
    } catch (error) {
      handleDbError(error);
    }
  }

  async update(id: number, data: ConsultantAvailabilityUpdateDto) {
    const current = await this.availabilityRepository.findOne(id);
    if (!current) throw new NotFoundException(`Availability month with ID ${id} not found`);

    const consultantId = data.consultantId ?? current.consultantId;
    const month = data.month ? this.getMonthStartFromDate(new Date(data.month)) : current.month;
    const availableSchedule = data.availableSchedule
      ? this.normalizeSchedule(data.availableSchedule, month)
      : current.availableSchedule;

    await this.validateConsultant(consultantId);

    try {
      const updated = await this.availabilityRepository.update(id, { consultantId, month, availableSchedule });
      return this.cleanAvailability(updated);
    } catch (error) {
      handleDbError(error);
    }
  }

  async delete(id: number) {
    await this.findOne(id);
    const deleted = await this.availabilityRepository.delete(id);
    return this.cleanAvailability(deleted);
  }

  async assertAvailableForMeeting(consultantId: number, startTime: Date, durationMinutes: number) {
    await this.validateConsultant(consultantId);
    
    // Validate that meetings are scheduled at least for tomorrow (from tomorrow onwards)
    const nowLocal = new Date(Date.now() + this.businessTimezoneOffsetMinutes * 60 * 1000);
    const tomorrowLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate() + 1, 0, 0, 0, 0));
    const tomorrowUtc = new Date(tomorrowLocal.getTime() - this.businessTimezoneOffsetMinutes * 60 * 1000);

    if (startTime.getTime() < tomorrowUtc.getTime()) {
      throw new BadRequestException(['Las reuniones deben programarse al menos de un día para otro']);
    }

    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    this.validateSlotRange(startTime, endTime);

    const availability = await this.availabilityRepository.findByMonth(consultantId, this.getMonthStartFromDate(startTime));
    const availableTimes = this.getHalfHourTimesInRange(startTime, endTime);
    const day = String(this.getLocalDateParts(startTime).day);
    const daySchedule = availability?.availableSchedule?.[day] ?? [];
    const hasEveryHalfHour = availableTimes.every((time) => daySchedule.includes(time));

    if (!hasEveryHalfHour) {
      throw new BadRequestException(['El consultor no tiene disponibilidad registrada para el horario seleccionado']);
    }

    const conflicts = await this.availabilityRepository.findMeetingConflicts(consultantId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new BadRequestException(['El horario seleccionado ya esta ocupado por otra reunion']);
    }

    const startParts = this.getLocalDateParts(startTime);
    const googleBusySlots = await this.findGoogleBusyMonth(consultantId, startParts.year, startParts.month);
    const hasGoogleConflict = googleBusySlots.some((slot) =>
      this.overlaps(startTime, endTime, new Date(slot.startTime), new Date(slot.endTime)),
    );
    if (hasGoogleConflict) {
      throw new BadRequestException(['El horario seleccionado esta ocupado en Google Calendar']);
    }
  }

  private async validateConsultant(consultantId: number) {
    const consultant = await this.consultantRepository.findByUserId(consultantId);
    if (!consultant) {
      throw new NotFoundException(`Consultant profile for user ID ${consultantId} not found`);
    }
  }

  private cleanAvailability(availability: ConsultantAvailability) {
    return {
      ...availability,
      month: this.toDateOnly(availability.month),
      availableSchedule: this.normalizeSchedule(availability.availableSchedule, availability.month),
    };
  }

  private normalizeSchedule(schedule: ConsultantAvailabilitySchedule, month: Date): ConsultantAvailabilitySchedule {
    const normalized = new Map<string, Set<string>>();
    const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();

    for (const [dayKey, times] of Object.entries(schedule ?? {})) {
      const day = Number(dayKey);
      if (!Number.isInteger(day) || day < 1 || day > lastDay) {
        throw new BadRequestException([`El dia ${dayKey} no pertenece al mes indicado`]);
      }

      if (!Array.isArray(times)) {
        throw new BadRequestException([`Los horarios del dia ${dayKey} deben enviarse como una lista`]);
      }

      const daySchedule = normalized.get(String(day)) ?? new Set<string>();
      for (const time of times) {
        if (!this.isValidTimeValue(time)) {
          throw new BadRequestException([`El horario ${time} debe tener formato HH:mm y estar alineado a media hora`]);
        }
        daySchedule.add(time);
      }
      normalized.set(String(day), daySchedule);
    }

    return Object.fromEntries(
      [...normalized.entries()]
        .sort(([leftDay], [rightDay]) => Number(leftDay) - Number(rightDay))
        .map(([day, times]) => [day, [...times].sort()]),
    );
  }

  private removeBusyConflictsFromSchedule(
    schedule: ConsultantAvailabilitySchedule,
    month: Date,
    busySlots: BusyConflict[],
  ): ConsultantAvailabilitySchedule {
    const filtered = new Map<string, Set<string>>();

    for (const [day, times] of Object.entries(schedule ?? {})) {
      for (const time of times) {
        const startTime = this.getDateFromMonthDayTime(month, Number(day), time);
        const endTime = new Date(startTime.getTime() + this.halfHourMinutes * 60 * 1000);
        const hasConflict = busySlots.some((slot) =>
          this.overlaps(startTime, endTime, new Date(slot.startTime), new Date(slot.endTime)),
        );

        if (!hasConflict) {
          const daySchedule = filtered.get(day) ?? new Set<string>();
          daySchedule.add(time);
          filtered.set(day, daySchedule);
        }
      }
    }

    return Object.fromEntries(
      [...filtered.entries()]
        .sort(([leftDay], [rightDay]) => Number(leftDay) - Number(rightDay))
        .map(([day, times]) => [day, [...times].sort()]),
    );
  }

  private validateSlotRange(startTime: Date, endTime: Date) {
    if (endTime <= startTime) {
      throw new BadRequestException(['La hora final debe ser mayor que la hora inicial']);
    }

    if (!this.isHalfHourAligned(startTime) || !this.isHalfHourAligned(endTime)) {
      throw new BadRequestException(['Los horarios deben estar alineados a bloques de 30 minutos']);
    }

    const startParts = this.getLocalDateParts(startTime);
    const endParts = this.getLocalDateParts(endTime);
    if (startParts.year !== endParts.year || startParts.month !== endParts.month || startParts.day !== endParts.day) {
      throw new BadRequestException(['La reunion debe pertenecer a un solo dia del mes']);
    }
  }

  private async findGoogleBusyMonth(consultantId: number, year: number, month: number): Promise<BusyConflict[]> {
    const response = await this.googleCalendarService.findBusyMonth({ consultantId, year, month });
    return response.data.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
  }

  private getMonthRange(year: number, month: number) {
    const startFrom = this.getUtcDateFromLocalParts(year, month, 1, 0, 0);
    const startTo = this.getUtcDateFromLocalParts(year, month + 1, 1, 0, 0);
    startTo.setMilliseconds(startTo.getMilliseconds() - 1);
    return { startFrom, startTo };
  }

  private getMonthStart(year: number, month: number) {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  }

  private getMonthStartFromDate(date: Date) {
    const parts = this.getLocalDateParts(date);
    return this.getMonthStart(parts.year, parts.month);
  }

  private toDateOnly(date: Date) {
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDateFromMonthDayTime(month: Date, day: number, time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return this.getUtcDateFromLocalParts(month.getUTCFullYear(), month.getUTCMonth() + 1, day, hours, minutes);
  }

  private getHalfHourTimesInRange(startTime: Date, endTime: Date) {
    const times: string[] = [];
    let cursor = new Date(startTime);

    while (cursor < endTime) {
      times.push(this.toTimeValue(cursor));
      cursor = new Date(cursor.getTime() + this.halfHourMinutes * 60 * 1000);
    }

    return times;
  }

  private toTimeValue(date: Date) {
    const parts = this.getLocalDateParts(date);
    return `${String(parts.hours).padStart(2, '0')}:${String(parts.minutes).padStart(2, '0')}`;
  }

  private isValidTimeValue(time: string) {
    if (!/^([01]\d|2[0-3]):(00|30)$/.test(time)) return false;
    return true;
  }

  private isHalfHourAligned(date: Date) {
    return date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0 && this.getLocalDateParts(date).minutes % this.halfHourMinutes === 0;
  }

  private getLocalDateParts(date: Date) {
    const localDate = new Date(date.getTime() + this.businessTimezoneOffsetMinutes * 60 * 1000);
    return {
      year: localDate.getUTCFullYear(),
      month: localDate.getUTCMonth() + 1,
      day: localDate.getUTCDate(),
      hours: localDate.getUTCHours(),
      minutes: localDate.getUTCMinutes(),
    };
  }

  private getUtcDateFromLocalParts(year: number, month: number, day: number, hours: number, minutes: number) {
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0) - this.businessTimezoneOffsetMinutes * 60 * 1000);
  }

  private getMeetingEndTime(meeting: MeetingConflict) {
    return new Date(meeting.startTime.getTime() + meeting.durationMinutes * 60 * 1000);
  }

  private overlaps(firstStart: Date, firstEnd: Date, secondStart: Date, secondEnd: Date) {
    return firstStart < secondEnd && firstEnd > secondStart;
  }
}
