import { database } from '@db/connection.db';
import type { user } from '@db/tables/user.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { task } from '@db/tables/task.table';
import { and, asc, count, desc, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class MeetingJoinQuery {
  @TraceNode({ name: 'meeting.findPymeDocumentsPaginated', type: 'method' })
  async findPymeDocumentsPaginated(pymeId: number, page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;
    const conditions = [eq(meeting.pymeId, pymeId), isNull(meeting.deletedAt), eq(meeting.status, 'finalizada')];
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
      .orderBy(
        desc(sql`COALESCE(${meeting.completedAt}, ${meeting.startTime}, ${meeting.createdAt})`),
        desc(meeting.id),
      )
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'meeting.findConsultantDocumentsPaginated', type: 'method' })
  async findConsultantDocumentsPaginated(consultantId: number, page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;
    const conditions = [
      eq(meeting.consultantId, consultantId),
      isNull(meeting.deletedAt),
      eq(meeting.status, 'finalizada'),
    ];
    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      const searchTerm = `%${normalizedSearch}%`;
      conditions.push(
        or(ilike(meeting.title, searchTerm), ilike(meeting.description, searchTerm), ilike(pyme.name, searchTerm)),
      );
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
      .orderBy(
        desc(sql`COALESCE(${meeting.completedAt}, ${meeting.startTime}, ${meeting.createdAt})`),
        desc(meeting.id),
      )
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'meeting.findCalendarPaginated', type: 'method' })
  async findCalendarPaginated(
    page: number,
    limit: number,
    range: {
      startDate: Date;
      endDate: Date;
      status?: 'solicitada' | 'pendiente' | 'confirmada' | 'finalizada' | 'cancelada';
    },
    requester: Pick<typeof user.$inferSelect, 'id' | 'role'>,
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
    const conditions = [isNull(meeting.deletedAt), hasCalendarOptionInRange];
    if (requester.role === 'pyme') {
      conditions.push(eq(meeting.pymeId, requester.id));
    } else if (requester.role === 'consultor') {
      conditions.push(eq(meeting.consultantId, requester.id));
    }
    if (range.status === 'pendiente') {
      conditions.push(eq(meeting.status, 'por_confirmar'));
    } else if (range.status) {
      conditions.push(eq(meeting.status, range.status));
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

  @TraceNode({ name: 'meeting.findOne', type: 'method' })
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

  @TraceNode({ name: 'meeting.findConfirmedUpcomingMeetingsWithoutNotifications', type: 'method' })
  async findConfirmedUpcomingMeetingsWithoutNotifications(now: Date) {
    return database
      .select()
      .from(meeting)
      .where(
        and(
          eq(meeting.status, 'confirmada'),
          gt(meeting.startTime, now),
          isNull(meeting.deletedAt),
          sql`NOT EXISTS (
            SELECT 1
            FROM scheduled_notification existing_notification
            WHERE existing_notification.meeting_id = ${meeting.id}
          )`,
        ),
      );
  }
}
