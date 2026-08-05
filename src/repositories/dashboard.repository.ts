import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant } from '@db/tables/consultant.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { task } from '@db/tables/task.table';

type DashboardRole = 'admin' | 'pyme' | 'consultor';

type DashboardMeetingScope = {
  userId?: number;
  role?: DashboardRole;
};

export type DashboardMeetingStats = {
  total: number;
  confirmed: number;
  requested: number;
  pending: number;
  completed: number;
};

export type DashboardLatestDiagnostic = {
  id: number;
  createdAt: Date;
  score: number;
};

@Injectable()
export class DashboardRepository {
  async countActiveCounterparts(scope: DashboardMeetingScope): Promise<number> {
    if (!scope.userId || (scope.role !== 'pyme' && scope.role !== 'consultor')) return 0;

    if (scope.role === 'consultor') {
      const [result] = await database
        .select({ total: sql<number>`count(distinct ${pyme.id})` })
        .from(pyme)
        .leftJoin(
          meeting,
          and(eq(meeting.pymeId, pyme.id), eq(meeting.consultantId, scope.userId), isNull(meeting.deletedAt)),
        )
        .leftJoin(task, and(eq(task.pymeId, pyme.id), eq(task.consultantId, scope.userId), isNull(task.deletedAt)))
        .where(and(or(isNotNull(meeting.id), isNotNull(task.id)), isNull(pyme.deletedAt)));

      return Number(result?.total ?? 0);
    }

    const [result] = await database
      .select({ total: sql<number>`count(distinct ${consultant.id})` })
      .from(consultant)
      .leftJoin(
        meeting,
        and(eq(meeting.consultantId, consultant.id), eq(meeting.pymeId, scope.userId), isNull(meeting.deletedAt)),
      )
      .leftJoin(task, and(eq(task.consultantId, consultant.id), eq(task.pymeId, scope.userId), isNull(task.deletedAt)))
      .where(and(or(isNotNull(meeting.id), isNotNull(task.id)), isNull(consultant.deletedAt)));

    return Number(result?.total ?? 0);
  }

  async findLatestDiagnostic(scope: DashboardMeetingScope): Promise<DashboardLatestDiagnostic | null> {
    if (!scope.userId || scope.role !== 'pyme') return null;

    const [latestDiagnostic] = await database
      .select({ id: diagnostic.id, createdAt: diagnostic.createdAt, score: diagnostic.score })
      .from(diagnostic)
      .where(and(isNull(diagnostic.deletedAt), eq(diagnostic.pymeId, scope.userId)))
      .orderBy(desc(diagnostic.createdAt), desc(diagnostic.id))
      .limit(1);

    return latestDiagnostic ?? null;
  }

  async getMeetingStats(scope: DashboardMeetingScope): Promise<DashboardMeetingStats> {
    const conditions = this.getMeetingScopeConditions(scope);

    const [statusRows, completedRows] = await Promise.all([
      database
        .select({ status: meeting.status, total: count() })
        .from(meeting)
        .where(and(...conditions))
        .groupBy(meeting.status),
      database
        .select({ total: count() })
        .from(meeting)
        .where(
          and(
            ...conditions,
            eq(meeting.status, 'finalizada'),
            isNotNull(meeting.description),
            sql`length(trim(${meeting.description})) > 0`,
          ),
        ),
    ]);

    const stats: DashboardMeetingStats = {
      total: 0,
      confirmed: 0,
      requested: 0,
      pending: 0,
      completed: Number(completedRows[0]?.total ?? 0),
    };

    for (const row of statusRows) {
      const total = Number(row.total);

      if (row.status === 'confirmada') stats.confirmed += total;
      if (row.status === 'solicitada') stats.requested += total;
      if (row.status === 'pago_pendiente' || row.status === 'por_confirmar') stats.pending += total;
    }

    stats.total = stats.confirmed + stats.requested + stats.pending + stats.completed;
    return stats;
  }

  async findUpcomingConfirmed(scope: DashboardMeetingScope, now = new Date()) {
    const weekEnd = this.getNextBusinessWeekStart(now);

    return database
      .select({
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        durationMinutes: meeting.durationMinutes,
        status: meeting.status,
      })
      .from(meeting)
      .where(
        and(
          ...this.getMeetingScopeConditions(scope),
          eq(meeting.status, 'confirmada'),
          sql`${meeting.startTime} + (${meeting.durationMinutes} * interval '1 minute') + interval '15 minutes' >= ${now}`,
          lt(meeting.startTime, weekEnd),
        ),
      )
      .orderBy(meeting.startTime)
      .limit(5);
  }

  private getMeetingScopeConditions(scope: DashboardMeetingScope) {
    const conditions = [isNull(meeting.deletedAt)];

    if (scope.userId && scope.role === 'consultor') {
      conditions.push(eq(meeting.consultantId, scope.userId));
    }

    if (scope.userId && scope.role === 'pyme') {
      conditions.push(eq(meeting.pymeId, scope.userId));
    }

    return conditions;
  }

  private getNextBusinessWeekStart(now: Date): Date {
    const businessTimezoneOffsetMinutes = -5 * 60;
    const businessNow = new Date(now.getTime() + businessTimezoneOffsetMinutes * 60_000);
    const businessDate = new Date(
      Date.UTC(businessNow.getUTCFullYear(), businessNow.getUTCMonth(), businessNow.getUTCDate()),
    );
    const daysSinceMonday = (businessDate.getUTCDay() + 6) % 7;
    const daysUntilNextMonday = 7 - daysSinceMonday;

    businessDate.setUTCDate(businessDate.getUTCDate() + daysUntilNextMonday);
    return new Date(businessDate.getTime() - businessTimezoneOffsetMinutes * 60_000);
  }
}
