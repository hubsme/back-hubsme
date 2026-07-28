import { Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meeting } from '@db/tables/meeting.table';

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

@Injectable()
export class DashboardRepository {
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

  async findUpcomingConfirmed(
    scope: DashboardMeetingScope,
    now = new Date(),
  ) {
    const weekEnd = this.getNextBusinessWeekStart(now);

    return database
      .select({ id: meeting.id, title: meeting.title, startTime: meeting.startTime, status: meeting.status })
      .from(meeting)
      .where(
        and(
          ...this.getMeetingScopeConditions(scope),
          eq(meeting.status, 'confirmada'),
          gte(meeting.startTime, now),
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
