import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  consultantAvailability,
  ConsultantAvailabilityDTO,
  ConsultantAvailabilitySchedule,
} from '@db/tables/consultant-availability.table';
import { meeting } from '@db/tables/meeting.table';

@Injectable()
export class ConsultantAvailabilityRepository {
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      consultantId?: number;
      startFrom?: Date;
      startTo?: Date;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = this.buildConditions(filters);
    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(consultantAvailability).where(whereClause);
    const data = await database
      .select()
      .from(consultantAvailability)
      .where(whereClause)
      .orderBy(desc(consultantAvailability.month))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(and(eq(consultantAvailability.id, id), isNull(consultantAvailability.deletedAt)));
    return result[0];
  }

  async findByMonth(consultantId: number, month: Date) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          eq(consultantAvailability.month, month),
          isNull(consultantAvailability.deletedAt),
        ),
      );
    return result[0];
  }

  async findByMonthRange(consultantId: number, startMonth: Date, endMonth: Date) {
    return database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          gte(consultantAvailability.month, startMonth),
          lte(consultantAvailability.month, endMonth),
          isNull(consultantAvailability.deletedAt),
        ),
      )
      .orderBy(consultantAvailability.month);
  }

  async findMeetingConflicts(consultantId: number, startFrom: Date, startTo: Date) {
    return database
      .select({
        id: meeting.id,
        startTime: meeting.startTime,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
      })
      .from(meeting)
      .where(
        and(
          eq(meeting.consultantId, consultantId),
          sql`${meeting.status}::text NOT IN ('cancelada', 'finalizada')`,
          sql`${meeting.startTime} < ${startTo}`,
          sql`${meeting.startTime} + (${meeting.durationMinutes} * interval '1 minute') > ${startFrom}`,
          isNull(meeting.deletedAt),
        ),
      )
      .orderBy(meeting.startTime);
  }

  async create(data: ConsultantAvailabilityDTO) {
    const result = await database.insert(consultantAvailability).values(data).returning();
    return result[0];
  }

  async upsertMonth(consultantId: number, month: Date, availableSchedule: ConsultantAvailabilitySchedule) {
    const current = await this.findByMonth(consultantId, month);

    if (current) {
      const result = await database
        .update(consultantAvailability)
        .set({ availableSchedule, updatedAt: new Date() })
        .where(and(eq(consultantAvailability.id, current.id), isNull(consultantAvailability.deletedAt)))
        .returning();
      return result[0];
    }

    return this.create({ consultantId, month, availableSchedule });
  }

  async update(id: number, data: Partial<ConsultantAvailabilityDTO>) {
    const result = await database
      .update(consultantAvailability)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantAvailability.id, id), isNull(consultantAvailability.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(consultantAvailability)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(consultantAvailability.id, id))
      .returning();
    return result[0];
  }

  private buildConditions(filters?: {
    consultantId?: number;
    startFrom?: Date;
    startTo?: Date;
  }) {
    const conditions = [];

    if (filters?.consultantId) {
      conditions.push(eq(consultantAvailability.consultantId, filters.consultantId));
    }

    if (filters?.startFrom) {
      conditions.push(gte(consultantAvailability.month, this.getMonthStart(filters.startFrom)));
    }

    if (filters?.startTo) {
      conditions.push(lte(consultantAvailability.month, this.getMonthStart(filters.startTo)));
    }

    conditions.push(isNull(consultantAvailability.deletedAt));
    return conditions;
  }

  private getMonthStart(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }
}
