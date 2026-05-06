import { Injectable } from '@nestjs/common';
import { eq, ilike, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meeting, MeetingDTO, meetingStatusEnum } from '@db/tables/meeting.table';

@Injectable()
export class MeetingRepository {
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      pymeId?: number;
      consultantId?: number;
      status?: (typeof meetingStatusEnum.enumValues)[number];
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.search) {
      conditions.push(ilike(meeting.title, `%${filters.search.trim()}%`));
    }

    if (filters?.pymeId) {
      conditions.push(eq(meeting.pymeId, filters.pymeId));
    }

    if (filters?.consultantId) {
      conditions.push(eq(meeting.consultantId, filters.consultantId));
    }

    if (filters?.status) {
      conditions.push(eq(sql`${meeting.status}::text`, filters.status));
    }

    conditions.push(isNull(meeting.deletedAt));
    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(meeting).where(whereClause);
    const data = await database
      .select()
      .from(meeting)
      .where(whereClause)
      .orderBy(desc(meeting.startTime))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(meeting)
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)));
    return result[0];
  }

  async create(data: MeetingDTO) {
    const result = await database.insert(meeting).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<MeetingDTO>) {
    const result = await database
      .update(meeting)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(meeting)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(meeting.id, id))
      .returning();
    return result[0];
  }
}
