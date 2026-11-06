import { and, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';

import { database, transaction } from '@db/connection.db';
import { meeting, meetingStatusEnum } from '@db/tables/meeting.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MeetingQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'meeting.findMeetingConflicts', type: 'method' })
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

  @TraceNode({ name: 'meeting.getMeetingStats', type: 'method' })
  async getMeetingStats(
    scope: {
      userId?: number;
      role?: 'admin' | 'pyme' | 'consultor';
    },
    period: {
      start: Date;
      end: Date;
    },
  ): Promise<{
    total: number;
    confirmed: number;
    requested: number;
    pending: number;
    completed: number;
  }> {
    const calendarStart = sql<Date>`
      COALESCE(
        ${meeting.startTime},
        NULLIF(${meeting.proposedStartTimes}[1], '')::timestamp,
        ${meeting.createdAt}
      )
    `;
    const conditions = [
      ...this.getMeetingScopeConditions(scope),
      gte(calendarStart, period.start),
      lt(calendarStart, period.end),
    ];
    const statusRows = await database
      .select({ status: meeting.status, total: count() })
      .from(meeting)
      .where(and(...conditions))
      .groupBy(meeting.status);
    const stats: {
      total: number;
      confirmed: number;
      requested: number;
      pending: number;
      completed: number;
    } = {
      total: 0,
      confirmed: 0,
      requested: 0,
      pending: 0,
      completed: 0,
    };
    for (const row of statusRows) {
      const total = Number(row.total);
      if (row.status === 'confirmada') stats.confirmed += total;
      if (row.status === 'solicitada') stats.requested += total;
      if (row.status === 'por_confirmar') stats.pending += total;
      if (row.status === 'finalizada') stats.completed += total;
    }
    stats.total = stats.confirmed + stats.requested + stats.pending + stats.completed;
    return stats;
  }

  @TraceNode({ name: 'meeting.findUpcoming', type: 'method' })
  async findUpcoming(
    scope: {
      userId?: number;
      role?: 'admin' | 'pyme' | 'consultor';
    },
    now = new Date(),
  ) {
    const horizonEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const displayStartTime = sql<Date>`
      COALESCE(
        ${meeting.startTime},
        NULLIF(${meeting.proposedStartTimes}[1], '')::timestamp
      )
    `;
    const proposedTimeInWindow = sql<boolean>`
      EXISTS (
        SELECT 1
        FROM unnest(${meeting.proposedStartTimes}) AS proposed_start(value)
        WHERE NULLIF(proposed_start.value, '')::timestamp < ${horizonEnd}
          AND NULLIF(proposed_start.value, '')::timestamp
            + (${meeting.durationMinutes} * interval '1 minute')
            + interval '15 minutes' >= ${now}
      )
    `;
    const scheduledTimeInWindow = and(
      isNotNull(meeting.startTime),
      lt(meeting.startTime, horizonEnd),
      sql`
        ${meeting.startTime}
          + (${meeting.durationMinutes} * interval '1 minute')
          + interval '15 minutes' >= ${now}
      `,
    );
    const canSeePendingMeetings = scope.role === 'pyme' || scope.role === 'consultor';
    const upcomingTimeCondition = canSeePendingMeetings
      ? or(scheduledTimeInWindow, and(eq(meeting.status, 'por_confirmar'), proposedTimeInWindow))
      : scheduledTimeInWindow;
    const statusCondition = canSeePendingMeetings
      ? inArray(meeting.status, ['por_confirmar', 'confirmada'])
      : eq(meeting.status, 'confirmada');
    return database
      .select({
        id: meeting.id,
        title: meeting.title,
        startTime: displayStartTime,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
      })
      .from(meeting)
      .where(and(...this.getMeetingScopeConditions(scope), statusCondition, upcomingTimeCondition))
      .orderBy(displayStartTime, meeting.id)
      .limit(5);
  }

  @TraceNode({ name: 'meeting.getMeetingScopeConditions', type: 'method' })
  private getMeetingScopeConditions(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    const conditions = [isNull(meeting.deletedAt)];
    if (scope.userId && scope.role === 'consultor') {
      conditions.push(eq(meeting.consultantId, scope.userId));
    }
    if (scope.userId && scope.role === 'pyme') {
      conditions.push(eq(meeting.pymeId, scope.userId));
    }
    return conditions;
  }

  @TraceNode({ name: 'meeting.findByServiceRequestId', type: 'method' })
  async findByServiceRequestId(serviceRequestId: number) {
    return database
      .select()
      .from(meeting)
      .where(and(eq(meeting.serviceRequestId, serviceRequestId), isNull(meeting.deletedAt)))
      .orderBy(asc(meeting.serviceMilestoneIndex), asc(meeting.startTime), asc(meeting.id));
  }

  @TraceNode({ name: 'meeting.findByServiceRequestMilestone', type: 'method' })
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

  @TraceNode({ name: 'meeting.findAllPaginated', type: 'method' })
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

  @TraceNode({ name: 'meeting.create', type: 'method' })
  async create(data: typeof meeting.$inferInsert) {
    const result = await database.insert(meeting).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'meeting.update', type: 'method' })
  async update(id: number, data: Partial<typeof meeting.$inferInsert>) {
    const result = await database
      .update(meeting)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(meeting.id, id), isNull(meeting.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'meeting.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(meeting)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(meeting.id, id))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'meeting.cancelForConsultant', type: 'method' })
  async cancelForConsultant(id: number, consultantId: number, cancellationReason: string) {
    return database
      .update(meeting)
      .set({ status: 'cancelada', cancellationReason, meetingUrl: null, updatedAt: new Date() })
      .where(
        and(
          eq(meeting.id, id),
          eq(meeting.consultantId, consultantId),
          inArray(meeting.status, ['por_confirmar', 'confirmada']),
          isNull(meeting.deletedAt),
        ),
      )
      .returning();
  }
  @TraceNode({ name: 'meeting.findActiveServiceMilestoneMeeting', type: 'method' })
  async findActiveServiceMilestoneMeeting(id: number, milestoneIndex: number) {
    return database
      .select({ id: meeting.id })
      .from(meeting)
      .where(
        and(
          eq(meeting.serviceRequestId, id),
          eq(meeting.meetingType, 'servicio'),
          eq(meeting.serviceMilestoneIndex, milestoneIndex),
          isNull(meeting.deletedAt),
        ),
      )
      .limit(1);
  }
  @TraceNode({ name: 'meeting.adjustServiceMilestoneIndices', type: 'method' })
  async adjustServiceMilestoneIndices(
    id: number,
    minimumIndex: number,
    amount: number,
    direction: 'add' | 'subtract',
    now: Date = new Date(),
  ) {
    const index =
      direction === 'add'
        ? sql<number>`${meeting.serviceMilestoneIndex} + ${amount}`
        : sql<number>`${meeting.serviceMilestoneIndex} - ${amount}`;
    await database
      .update(meeting)
      .set({ serviceMilestoneIndex: index, updatedAt: now })
      .where(
        and(
          and(eq(meeting.serviceRequestId, id), eq(meeting.meetingType, 'servicio'), isNull(meeting.deletedAt)),
          gte(meeting.serviceMilestoneIndex, minimumIndex),
        ),
      );
  }
  @TraceNode({ name: 'meeting.deleteServiceMilestone', type: 'method' })
  async deleteServiceMilestone(id: number, milestoneIndex: number, now: Date) {
    await database
      .update(meeting)
      .set({ deletedAt: now, updatedAt: now })
      .where(
        and(
          and(eq(meeting.serviceRequestId, id), eq(meeting.meetingType, 'servicio'), isNull(meeting.deletedAt)),
          eq(meeting.serviceMilestoneIndex, milestoneIndex),
        ),
      );
  }

  @TraceNode({ name: 'meeting.findBillableForDashboard', type: 'method' })
  async findBillableForDashboard(
    scope: {
      userId?: number;
      role?: 'admin' | 'pyme' | 'consultor';
    },
    start: Date,
    end: Date,
  ) {
    return database
      .select({ durationMinutes: meeting.durationMinutes })
      .from(meeting)
      .where(
        and(
          ...this.getMeetingScopeConditions(scope),
          eq(meeting.status, 'finalizada' as const),
          gte(meeting.startTime, start),
          lt(meeting.startTime, end),
        ),
      );
  }
}
