import { Injectable } from '@nestjs/common';
import { and, count, eq, gte, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { diagnostic } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { task } from '@db/tables/task.table';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Injectable()
export class DashboardService {
  async summary(filters: DashboardFilterDto) {
    const role = filters.role ?? 'admin';
    const userId = filters.userId;
    const meetingConditions = [isNull(meeting.deletedAt)];
    const taskConditions = [isNull(task.deletedAt)];
    const diagnosticConditions = [isNull(diagnostic.deletedAt)];

    if (userId && role === 'consultor') {
      meetingConditions.push(eq(meeting.consultantId, userId));
      taskConditions.push(eq(task.consultantId, userId));
    }

    if (userId && role === 'pyme') {
      meetingConditions.push(eq(meeting.pymeId, userId));
      taskConditions.push(eq(task.pymeId, userId));
      diagnosticConditions.push(eq(diagnostic.pymeId, userId));
    }

    const [meetingCount, taskCount, diagnosticCount, taskRows, upcomingRows, meetingRows] = await Promise.all([
      database.select({ total: count() }).from(meeting).where(and(...meetingConditions)),
      database.select({ total: count() }).from(task).where(and(...taskConditions)),
      database.select({ total: count() }).from(diagnostic).where(and(...diagnosticConditions)),
      database.select({ status: task.status }).from(task).where(and(...taskConditions)),
      database
        .select({ id: meeting.id, title: meeting.title, startTime: meeting.startTime, status: meeting.status })
        .from(meeting)
        .where(and(...meetingConditions, gte(meeting.startTime, new Date())))
        .limit(5),
      database.select({ pymeId: meeting.pymeId }).from(meeting).where(and(...meetingConditions)),
    ]);

    const taskStatus = taskRows.reduce(
      (acc, row) => {
        if (row.status === 'en_progreso') acc.enProgreso += 1;
        else acc[row.status] += 1;
        return acc;
      },
      { pendiente: 0, enProgreso: 0, completada: 0, bloqueada: 0 },
    );

    const clientCount = role === 'consultor' ? new Set(meetingRows.map((item) => item.pymeId)).size : 0;

    return {
      stats: {
        clients: clientCount,
        meetings: Number(meetingCount[0].total),
        tasks: Number(taskCount[0].total),
        diagnostics: Number(diagnosticCount[0].total),
      },
      taskStatus,
      upcomingMeetings: upcomingRows,
    };
  }
}
