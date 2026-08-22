import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { task } from '@db/tables/task.table';
import { user } from '@db/tables/user.table';
import { DashboardRepository } from '@repositories/dashboard.repository';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { peruMonthRange } from '@functions/date.function';
import { AuthenticatedUser } from '@modules/auth/authenticated-user.type';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  summaryForUser(filters: DashboardFilterDto, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'admin') return this.summary(filters);
    return this.summary({
      ...filters,
      role: currentUser.role,
      userId: currentUser.role === 'pyme' ? (currentUser.pymeId ?? currentUser.id) : currentUser.id,
    });
  }

  async summary(filters: DashboardFilterDto) {
    const role = filters.role ?? 'admin';
    const userId = filters.userId;
    const meetingConditions = [isNull(meeting.deletedAt)];
    const taskConditions = [isNull(task.deletedAt)];
    const diagnosticConditions = [isNull(diagnostic.deletedAt)];
    const alertConditions = [isNull(dashboardAlert.deletedAt), eq(dashboardAlert.status, 'active' as const)];

    if (userId && role === 'consultor') {
      meetingConditions.push(eq(meeting.consultantId, userId));
      taskConditions.push(eq(task.consultantId, userId));
      alertConditions.push(eq(dashboardAlert.consultantId, userId));
    }

    if (userId && role === 'pyme') {
      meetingConditions.push(eq(meeting.pymeId, userId));
      taskConditions.push(eq(task.pymeId, userId));
      diagnosticConditions.push(eq(diagnostic.pymeId, userId));
      alertConditions.push(eq(dashboardAlert.pymeId, userId));
    }

    const now = new Date();
    const meetingPeriod = this.currentLimaMonthRange(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const billableMeetingConditions = [
      ...meetingConditions,
      eq(meeting.status, 'finalizada' as const),
      gte(meeting.startTime, monthStart),
      lt(meeting.startTime, nextMonthStart),
    ];

    const [
      taskCount,
      diagnosticCount,
      taskRows,
      upcomingRows,
      billableMeetingRows,
      activeCounterpartCount,
      alertRows,
      meetingStats,
      latestDiagnostic,
      taskDeadlines,
    ] = await Promise.all([
      database
        .select({ total: count() })
        .from(task)
        .where(and(...taskConditions)),
      database
        .select({ total: count() })
        .from(diagnostic)
        .where(and(...diagnosticConditions)),
      database
        .select({ pymeId: task.pymeId, status: task.status })
        .from(task)
        .where(and(...taskConditions)),
      this.dashboardRepository.findUpcoming({ userId, role }, now),
      database
        .select({ durationMinutes: meeting.durationMinutes })
        .from(meeting)
        .where(and(...billableMeetingConditions)),
      this.dashboardRepository.countActiveCounterparts({ userId, role }),
      database
        .select({
          id: dashboardAlert.id,
          client: dashboardAlert.clientName,
          message: dashboardAlert.message,
          tone: dashboardAlert.tone,
        })
        .from(dashboardAlert)
        .where(and(...alertConditions))
        .orderBy(desc(dashboardAlert.createdAt))
        .limit(5),
      this.dashboardRepository.getMeetingStats({ userId, role }, meetingPeriod),
      this.dashboardRepository.findLatestDiagnostic({ userId, role }),
      this.dashboardRepository.findTaskDeadlines({ userId, role }, now),
    ]);

    const taskStatus = taskRows.reduce(
      (acc, row) => {
        if (row.status === 'en_progreso') acc.enProgreso += 1;
        else acc[row.status] += 1;
        return acc;
      },
      { pendiente: 0, enProgreso: 0, completada: 0, bloqueada: 0 },
    );

    const billableHours = billableMeetingRows.reduce((acc, row) => acc + row.durationMinutes / 60, 0);
    const pymeIds = [...new Set(taskRows.map((row) => row.pymeId))];
    const pymeRows =
      pymeIds.length > 0
        ? await database
            .select({ userId: pyme.id, pymeName: pyme.name, userName: user.name })
            .from(user)
            .leftJoin(pyme, eq(pyme.id, user.id))
            .where(and(inArray(user.id, pymeIds), isNull(user.deletedAt)))
        : [];
    const pymeNameByUserId = pymeRows.reduce<Record<number, string>>((acc, row) => {
      acc[row.userId] = row.pymeName ?? row.userName;
      return acc;
    }, {});
    const workloadByClient = taskRows.reduce<
      Record<
        number,
        {
          pymeId: number;
          name: string;
          total: number;
          completed: number;
          pending: number;
          inProgress: number;
        }
      >
    >((acc, row) => {
      const current = acc[row.pymeId] ?? {
        pymeId: row.pymeId,
        name: pymeNameByUserId[row.pymeId] ?? `PYME ${row.pymeId}`,
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
      };

      current.total += 1;
      if (row.status === 'completada') current.completed += 1;
      if (row.status === 'pendiente') current.pending += 1;
      if (row.status === 'en_progreso') current.inProgress += 1;
      acc[row.pymeId] = current;
      return acc;
    }, {});

    return {
      stats: {
        clients: activeCounterpartCount,
        meetings: meetingStats.total,
        tasks: Number(taskCount[0].total),
        diagnostics: Number(diagnosticCount[0].total),
        billableHours,
      },
      latestDiagnostic,
      meetingStats,
      taskStatus,
      ...taskDeadlines,
      upcomingMeetings: upcomingRows,
      workloadByClient: Object.values(workloadByClient),
      alerts: alertRows,
    };
  }

  private currentLimaMonthRange(now: Date): { start: Date; end: Date } {
    return peruMonthRange(now);
  }
}
