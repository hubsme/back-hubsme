import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  consultantAvailability,
  ConsultantAvailabilityDTO,
  consultantAvailabilityStatusEnum,
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
      status?: (typeof consultantAvailabilityStatusEnum.enumValues)[number];
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
      .orderBy(desc(consultantAvailability.startTime))
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

  async findByRange(
    consultantId: number,
    startFrom: Date,
    startTo: Date,
    status?: (typeof consultantAvailabilityStatusEnum.enumValues)[number],
  ) {
    return database
      .select()
      .from(consultantAvailability)
      .where(and(...this.buildConditions({ consultantId, startFrom, startTo, status })))
      .orderBy(consultantAvailability.startTime);
  }

  async findCoveringSlot(consultantId: number, startTime: Date, endTime: Date) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          eq(sql`${consultantAvailability.status}::text`, 'disponible'),
          lte(consultantAvailability.startTime, startTime),
          gte(consultantAvailability.endTime, endTime),
          isNull(consultantAvailability.deletedAt),
        ),
      );
    return result[0];
  }

  async findOverlappingAvailability(consultantId: number, startTime: Date, endTime: Date, excludeId?: number) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          sql`${consultantAvailability.startTime} < ${endTime}`,
          sql`${consultantAvailability.endTime} > ${startTime}`,
          excludeId ? sql`${consultantAvailability.id} <> ${excludeId}` : sql`true`,
          isNull(consultantAvailability.deletedAt),
        ),
      );
    return result[0];
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

  async createMany(data: ConsultantAvailabilityDTO[]) {
    if (data.length === 0) return [];
    return database.insert(consultantAvailability).values(data).returning();
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

  async deleteByRange(consultantId: number, startFrom: Date, startTo: Date) {
    return database
      .update(consultantAvailability)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(...this.buildConditions({ consultantId, startFrom, startTo })))
      .returning();
  }

  private buildConditions(filters?: {
    consultantId?: number;
    startFrom?: Date;
    startTo?: Date;
    status?: (typeof consultantAvailabilityStatusEnum.enumValues)[number];
  }) {
    const conditions = [];

    if (filters?.consultantId) {
      conditions.push(eq(consultantAvailability.consultantId, filters.consultantId));
    }

    if (filters?.startFrom) {
      conditions.push(gte(consultantAvailability.startTime, filters.startFrom));
    }

    if (filters?.startTo) {
      conditions.push(lte(consultantAvailability.startTime, filters.startTo));
    }

    if (filters?.status) {
      conditions.push(eq(sql`${consultantAvailability.status}::text`, filters.status));
    }

    conditions.push(isNull(consultantAvailability.deletedAt));
    return conditions;
  }
}
