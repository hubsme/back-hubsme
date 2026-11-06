import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { meeting } from '@db/tables/meeting.table';
import { task, taskAssignedToEnum, taskPriorityEnum, taskStatusEnum } from '@db/tables/task.table';
import { and, count, desc, eq, getTableColumns, ilike, isNull, sql } from 'drizzle-orm';

@Injectable()
export class TaskJoinQuery {
  @TraceNode({ name: 'task.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      pymeId?: number;
      consultantId?: number;
      assignedTo?: (typeof taskAssignedToEnum.enumValues)[number];
      priority?: (typeof taskPriorityEnum.enumValues)[number];
      status?: (typeof taskStatusEnum.enumValues)[number];
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.search) {
      conditions.push(ilike(task.title, `%${filters.search.trim()}%`));
    }
    if (filters?.pymeId) {
      conditions.push(eq(task.pymeId, filters.pymeId));
    }
    if (filters?.consultantId) {
      conditions.push(eq(task.consultantId, filters.consultantId));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(sql`${task.assignedTo}::text`, filters.assignedTo));
    }
    if (filters?.priority) {
      conditions.push(eq(sql`${task.priority}::text`, filters.priority));
    }
    if (filters?.status) {
      conditions.push(eq(sql`${task.status}::text`, filters.status));
    }
    conditions.push(isNull(task.deletedAt));
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(task).where(whereClause);
    const data = await database
      .select({
        ...getTableColumns(task),
        meetingStartTime: meeting.startTime,
        meetingTitle: meeting.title,
      })
      .from(task)
      .leftJoin(meeting, eq(task.meetingId, meeting.id))
      .where(whereClause)
      .orderBy(desc(task.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'task.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select({
        ...getTableColumns(task),
        meetingStartTime: meeting.startTime,
        meetingTitle: meeting.title,
      })
      .from(task)
      .leftJoin(meeting, eq(task.meetingId, meeting.id))
      .where(and(eq(task.id, id), isNull(task.deletedAt)));
    return result[0];
  }
}
