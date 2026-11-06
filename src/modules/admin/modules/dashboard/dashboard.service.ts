import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { DashboardAlertQuery } from '@queries/dashboard-alert/dashboard-alert.query';
import { DiagnosticQuery } from '@queries/diagnostic/diagnostic.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { UserJoinQuery } from '@queries/user/user-join.query';

import { Trace } from '@erixcel/traceflow';
import { DateFunction } from '@functions/date.function';
import { DashboardFilterDto } from '@modules/admin/modules/dashboard/dto/summary.dto';
import { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';
import { Injectable } from '@nestjs/common';

// Prepara los datos del dashboard.
@Trace({ name: 'dashboard', type: 'service' })
@Injectable()
export class DashboardService {
  constructor(
    private readonly userJoinQuery: UserJoinQuery,
    private readonly taskQuery: TaskQuery,
    private readonly diagnosticQuery: DiagnosticQuery,
    private readonly meetingQuery: MeetingQuery,
    private readonly dashboardAlertQuery: DashboardAlertQuery,
    private readonly pymeJoinQuery: PymeJoinQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
  ) {}

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
    const now = new Date();
    const meetingPeriod = this.currentLimaMonthRange(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const {
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
    } = await this.loadSummaryData({ userId, role }, now, meetingPeriod, monthStart, nextMonthStart);

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
    const pymeRows = await this.userJoinQuery.findPymeNames(pymeIds);
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
    return DateFunction.peruMonthRange(now);
  }

  private async loadSummaryData(
    scope: {
      userId?: number;
      role?: 'admin' | 'pyme' | 'consultor';
    },
    now: Date,
    meetingPeriod: {
      start: Date;
      end: Date;
    },
    monthStart: Date,
    nextMonthStart: Date,
  ) {
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
      this.taskQuery.countForDashboard(scope),
      this.diagnosticQuery.countForDashboard(scope),
      this.taskQuery.findDashboardTaskRows(scope),
      this.meetingQuery.findUpcoming(scope, now),
      this.meetingQuery.findBillableForDashboard(scope, monthStart, nextMonthStart),
      this.countActiveCounterparts(scope),
      this.dashboardAlertQuery.findActiveForDashboard(scope),
      this.meetingQuery.getMeetingStats(scope, meetingPeriod),
      this.diagnosticQuery.findLatestDiagnostic(scope),
      this.taskQuery.findTaskDeadlines(scope, now),
    ]);
    return {
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
    };
  }
  private countActiveCounterparts(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }): Promise<number> {
    if (!scope.userId || (scope.role !== 'pyme' && scope.role !== 'consultor')) return Promise.resolve(0);
    return scope.role === 'consultor'
      ? this.pymeJoinQuery.countActiveForConsultant(scope.userId)
      : this.consultantJoinQuery.countActiveForPyme(scope.userId);
  }
}
