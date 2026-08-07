import { Injectable } from '@nestjs/common';
import { eq, ilike, and, isNull, count, desc, sql, asc, inArray, or } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meeting, MeetingDTO, meetingStatusEnum } from '@db/tables/meeting.table';
import { task } from '@db/tables/task.table';
import { consultant } from '@db/tables/consultant.table';
import { pyme } from '@db/tables/pyme.table';
import { User } from '@db/tables/user.table';
import { promotionCode, PromotionCodeDTO } from '@db/tables/promotion-code.table';

@Injectable()
export class MeetingRepository {
  async findByServiceRequestId(serviceRequestId: number) {
    return database
      .select()
      .from(meeting)
      .where(and(eq(meeting.serviceRequestId, serviceRequestId), isNull(meeting.deletedAt)))
      .orderBy(asc(meeting.serviceMilestoneIndex), asc(meeting.startTime), asc(meeting.id));
  }

  async findByServiceRequestMilestone(serviceRequestId: number, milestoneIndex: number) {
    const result = await database
      .select()
      .from(meeting)
      .where(
        and(
          eq(meeting.serviceRequestId, serviceRequestId),
          eq(meeting.serviceMilestoneIndex, milestoneIndex),
          isNull(meeting.deletedAt),
        ),
      )
      .limit(1);
    return result[0];
  }

  async findPymeDocumentsPaginated(
    pymeId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions = [
      eq(meeting.pymeId, pymeId),
      isNull(meeting.deletedAt),
      or(eq(meeting.status, 'finalizada'), sql`${meeting.description} IS NOT NULL`),
    ];
    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      const searchTerm = `%${normalizedSearch}%`;
      conditions.push(
        or(
          ilike(meeting.title, searchTerm),
          ilike(meeting.description, searchTerm),
          ilike(consultant.fullName, searchTerm),
        ),
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: count() })
      .from(meeting)
      .leftJoin(pyme, eq(pyme.id, meeting.pymeId))
      .leftJoin(consultant, eq(consultant.id, meeting.consultantId))
      .where(whereClause);
    const data = await database
      .select({
        id: meeting.id,
        pymeId: meeting.pymeId,
        pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
        pymeLogoUrl: pyme.logoUrl,
        consultantId: meeting.consultantId,
        consultantName: sql<string>`COALESCE(${consultant.fullName}, 'Consultor')`,
        consultantPhotoUrl: consultant.photoUrl,
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        startTime: meeting.startTime,
        completedAt: meeting.completedAt,
      })
      .from(meeting)
      .leftJoin(pyme, eq(pyme.id, meeting.pymeId))
      .leftJoin(consultant, eq(consultant.id, meeting.consultantId))
      .where(whereClause)
      .orderBy(desc(sql`COALESCE(${meeting.completedAt}, ${meeting.startTime}, ${meeting.createdAt})`), desc(meeting.id))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findConsultantDocumentsPaginated(
    consultantId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions = [
      eq(meeting.consultantId, consultantId),
      isNull(meeting.deletedAt),
      or(eq(meeting.status, 'finalizada'), sql`${meeting.description} IS NOT NULL`),
    ];
    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      const searchTerm = `%${normalizedSearch}%`;
      conditions.push(or(ilike(meeting.title, searchTerm), ilike(meeting.description, searchTerm), ilike(pyme.name, searchTerm)));
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: count() })
      .from(meeting)
      .leftJoin(pyme, eq(pyme.id, meeting.pymeId))
      .where(whereClause);
    const data = await database
      .select({
        id: meeting.id,
        pymeId: meeting.pymeId,
        pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
        pymeLogoUrl: pyme.logoUrl,
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        startTime: meeting.startTime,
        completedAt: meeting.completedAt,
      })
      .from(meeting)
      .leftJoin(pyme, eq(pyme.id, meeting.pymeId))
      .where(whereClause)
      .orderBy(desc(sql`COALESCE(${meeting.completedAt}, ${meeting.startTime}, ${meeting.createdAt})`), desc(meeting.id))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findCalendarPaginated(
    page: number,
    limit: number,
    range: { startDate: Date; endDate: Date },
    requester: Pick<User, 'id' | 'role'>,
  ) {
    const offset = (page - 1) * limit;
    const calendarStart = sql<Date>`
      COALESCE(
        ${meeting.startTime},
        NULLIF(${meeting.proposedStartTimes}[1], '')::timestamp,
        ${meeting.createdAt}
      )
    `;
    const hasCalendarOptionInRange = sql<boolean>`
      (
        (${calendarStart} >= ${range.startDate} AND ${calendarStart} < ${range.endDate})
        OR EXISTS (
          SELECT 1
          FROM unnest(${meeting.proposedStartTimes}) AS proposed_start(value)
          WHERE NULLIF(proposed_start.value, '')::timestamp >= ${range.startDate}
            AND NULLIF(proposed_start.value, '')::timestamp < ${range.endDate}
        )
      )
    `;
    const conditions = [
      isNull(meeting.deletedAt),
      hasCalendarOptionInRange,
    ];

    if (requester.role === 'pyme') {
      conditions.push(eq(meeting.pymeId, requester.id));
    } else if (requester.role === 'consultor') {
      conditions.push(eq(meeting.consultantId, requester.id));
    }

    const whereClause = and(...conditions);
    const baseQuery = database
      .select({
        id: meeting.id,
        createdAt: meeting.createdAt,
        pymeId: meeting.pymeId,
        pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
        consultantId: meeting.consultantId,
        consultantName: sql<string>`COALESCE(${consultant.fullName}, 'Consultor')`,
        consultantPhotoUrl: consultant.photoUrl,
        serviceRequestId: meeting.serviceRequestId,
        serviceMilestoneIndex: meeting.serviceMilestoneIndex,
        meetingType: meeting.meetingType,
        consultantPricePerHour: sql<string>`COALESCE(${consultant.pricePerHour}, '0.00')`,
        title: meeting.title,
        startTime: meeting.startTime,
        proposedStartTimes: meeting.proposedStartTimes,
        durationMinutes: meeting.durationMinutes,
        hasMeetingLink: sql<boolean>`${meeting.meetingUrl} IS NOT NULL`,
        status: meeting.status,
        requestedBy: meeting.requestedBy,
        description: meeting.description,
        cancellationReason: meeting.cancellationReason,
        completedAt: meeting.completedAt,
      })
      .from(meeting)
      .leftJoin(consultant, eq(consultant.id, meeting.consultantId))
      .leftJoin(pyme, eq(pyme.id, meeting.pymeId))
      .where(whereClause);

    const [{ total }] = await database.select({ total: count() }).from(meeting).where(whereClause);
    const data = await baseQuery.orderBy(asc(calendarStart), asc(meeting.id)).limit(limit).offset(offset);

    return { data, total: Number(total) };
  }

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
    const meetingResult = await database
      .select()
      .from(meeting)
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)));

    if (!meetingResult[0]) return null;

    const tasks = await database
      .select()
      .from(task)
      .where(and(eq(task.meetingId, id), isNull(task.deletedAt)));

    return { ...meetingResult[0], tasks };
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

  async cancelByConsultantWithPromotionCode(
    id: number,
    consultantId: number,
    cancellationReason: string,
    promotionData: PromotionCodeDTO,
  ) {
    return database.transaction(async (tx) => {
      const cancelledMeetings = await tx
        .update(meeting)
        .set({
          status: 'cancelada',
          cancellationReason,
          meetingUrl: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(meeting.id, id),
            eq(meeting.consultantId, consultantId),
            inArray(meeting.status, ['por_confirmar', 'confirmada']),
            isNull(meeting.deletedAt),
          ),
        )
        .returning();

      if (!cancelledMeetings[0]) return undefined;

      const promotionCodes = await tx
        .insert(promotionCode)
        .values(promotionData)
        .returning();

      return {
        meeting: cancelledMeetings[0],
        promotionCode: promotionCodes[0],
      };
    });
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
