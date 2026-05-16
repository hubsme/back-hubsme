import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { pymeConsultantMatch } from '@db/tables/pyme-consultant-match.table';
import { task } from '@db/tables/task.table';
import { user } from '@db/tables/user.table';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  async summary(filters: DashboardFilterDto) {
    const role = filters.role ?? 'admin';
    const userId = filters.userId;
    const meetingConditions = [isNull(meeting.deletedAt)];
    const taskConditions = [isNull(task.deletedAt)];
    const diagnosticConditions = [isNull(diagnostic.deletedAt)];
    const matchConditions = [
      isNull(pymeConsultantMatch.deletedAt),
      eq(pymeConsultantMatch.status, 'aceptado' as const),
    ];
    const alertConditions = [isNull(dashboardAlert.deletedAt), eq(dashboardAlert.status, 'active' as const)];

    if (userId && role === 'consultor') {
      meetingConditions.push(eq(meeting.consultantId, userId));
      taskConditions.push(eq(task.consultantId, userId));
      matchConditions.push(eq(pymeConsultantMatch.consultantId, userId));
      alertConditions.push(eq(dashboardAlert.consultantId, userId));
    }

    if (userId && role === 'pyme') {
      meetingConditions.push(eq(meeting.pymeId, userId));
      taskConditions.push(eq(task.pymeId, userId));
      diagnosticConditions.push(eq(diagnostic.pymeId, userId));
      matchConditions.push(eq(pymeConsultantMatch.pymeId, userId));
      alertConditions.push(eq(dashboardAlert.pymeId, userId));
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const billableMeetingConditions = [
      ...meetingConditions,
      eq(meeting.status, 'finalizada' as const),
      gte(meeting.startTime, monthStart),
      lt(meeting.startTime, nextMonthStart),
    ];

    const [
      meetingCount,
      taskCount,
      diagnosticCount,
      taskRows,
      upcomingRows,
      billableMeetingRows,
      matchRows,
      alertRows,
    ] = await Promise.all([
      database
        .select({ total: count() })
        .from(meeting)
        .where(and(...meetingConditions)),
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
      database
        .select({ id: meeting.id, title: meeting.title, startTime: meeting.startTime, status: meeting.status })
        .from(meeting)
        .where(and(...meetingConditions, gte(meeting.startTime, new Date())))
        .orderBy(meeting.startTime)
        .limit(5),
      database
        .select({ durationMinutes: meeting.durationMinutes })
        .from(meeting)
        .where(and(...billableMeetingConditions)),
      database
        .select({ pymeId: pymeConsultantMatch.pymeId, consultantId: pymeConsultantMatch.consultantId })
        .from(pymeConsultantMatch)
        .where(and(...matchConditions)),
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
    ]);

    const taskStatus = taskRows.reduce(
      (acc, row) => {
        if (row.status === 'en_progreso') acc.enProgreso += 1;
        else acc[row.status] += 1;
        return acc;
      },
      { pendiente: 0, enProgreso: 0, completada: 0, bloqueada: 0 },
    );

    const clientCount =
      role === 'consultor'
        ? new Set(matchRows.map((item) => item.pymeId)).size
        : role === 'pyme'
          ? new Set(matchRows.map((item) => item.consultantId)).size
          : 0;
    const billableHours = billableMeetingRows.reduce((acc, row) => acc + row.durationMinutes / 60, 0);
    const pymeIds = [...new Set(taskRows.map((row) => row.pymeId))];
    const pymeRows =
      pymeIds.length > 0
        ? await database
            .select({ userId: pyme.userId, pymeName: pyme.name, userName: user.name })
            .from(user)
            .leftJoin(pyme, eq(pyme.userId, user.id))
            .where(and(inArray(user.id, pymeIds), isNull(user.deletedAt)))
        : [];
    const pymeNameByUserId = pymeRows.reduce<Record<number, string>>((acc, row) => {
      acc[row.userId] = row.pymeName ?? row.userName;
      return acc;
    }, {});
    const workloadByClient = taskRows.reduce<
      Record<number, { pymeId: number; name: string; total: number; completed: number }>
    >((acc, row) => {
      const current = acc[row.pymeId] ?? {
        pymeId: row.pymeId,
        name: pymeNameByUserId[row.pymeId] ?? `PYME ${row.pymeId}`,
        total: 0,
        completed: 0,
      };

      current.total += 1;
      if (row.status === 'completada') current.completed += 1;
      acc[row.pymeId] = current;
      return acc;
    }, {});

    return {
      stats: {
        clients: clientCount,
        meetings: Number(meetingCount[0].total),
        tasks: Number(taskCount[0].total),
        diagnostics: Number(diagnosticCount[0].total),
        billableHours,
      },
      taskStatus,
      upcomingMeetings: upcomingRows,
      workloadByClient: Object.values(workloadByClient),
      alerts: alertRows,
    };
  }
}
