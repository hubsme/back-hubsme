import { database, transaction } from '@db/connection.db';
import { task } from '@db/tables/task.table';
import { TraceNode } from '@erixcel/traceflow';
import { DateFunction } from '@functions/date.function';
import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, isNotNull, isNull, lt, ne } from 'drizzle-orm';

@Injectable()
export class TaskQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'task.findTaskDeadlines', type: 'method' })
  async findTaskDeadlines(
    scope: {
      userId?: number;
      role?: 'admin' | 'pyme' | 'consultor';
    },
    now = new Date(),
    limit = 4,
  ) {
    const todayKey = DateFunction.dateKeyInPeru(now);
    const todayStart = DateFunction.peruDateOnlyToUtc(todayKey);
    const horizonEnd = DateFunction.peruDateOnlyToUtc(DateFunction.addDaysToDateOnly(todayKey, 7));
    if (!todayStart || !horizonEnd) {
      return { upcomingTasks: [], overdueTasks: [] };
    }
    const fields = {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: task.assignedTo,
      status: task.status,
    };
    const baseConditions = [
      ...this.getTaskScopeConditions(scope),
      isNotNull(task.dueDate),
      ne(task.status, 'completada'),
    ];
    const [upcomingTasks, overdueTasks] = await Promise.all([
      database
        .select(fields)
        .from(task)
        .where(and(...baseConditions, gte(task.dueDate, todayStart), lt(task.dueDate, horizonEnd)))
        .orderBy(asc(task.dueDate), asc(task.id))
        .limit(limit),
      database
        .select(fields)
        .from(task)
        .where(and(...baseConditions, lt(task.dueDate, todayStart)))
        .orderBy(desc(task.dueDate), desc(task.id))
        .limit(limit),
    ]);
    return { upcomingTasks, overdueTasks };
  }

  @TraceNode({ name: 'task.getTaskScopeConditions', type: 'method' })
  private getTaskScopeConditions(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    const conditions = [isNull(task.deletedAt)];
    if (scope.userId && scope.role === 'consultor') {
      conditions.push(eq(task.consultantId, scope.userId));
    }
    if (scope.userId && scope.role === 'pyme') {
      conditions.push(eq(task.pymeId, scope.userId));
    }
    return conditions;
  }

  @TraceNode({ name: 'task.create', type: 'method' })
  async create(data: typeof task.$inferInsert) {
    const result = await database.insert(task).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'task.createMany', type: 'method' })
  async createMany(data: (typeof task.$inferInsert)[]) {
    if (data.length === 0) return [];
    return await database.insert(task).values(data).returning();
  }

  @TraceNode({ name: 'task.update', type: 'method' })
  async update(id: number, data: Partial<typeof task.$inferInsert>) {
    const result = await database
      .update(task)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(task.id, id), isNull(task.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'task.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(task)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(task.id, id))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'task.deleteByMeetingId', type: 'method' })
  async deleteByMeetingId(meetingId: number) {
    return await database
      .update(task)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(task.meetingId, meetingId), isNull(task.deletedAt)))
      .returning();
  }

  @TraceNode({ name: 'task.lockSourceTask', type: 'method' })
  async lockSourceTask(id: number) {
    return database
      .select({ serviceRequestId: task.serviceRequestId })
      .from(task)
      .where(and(eq(task.id, id), isNull(task.deletedAt)))
      .for('update');
  }
  @TraceNode({ name: 'task.linkServiceRequest', type: 'method' })
  async linkServiceRequest(id: number, serviceRequestId: number) {
    await database.update(task).set({ serviceRequestId, updatedAt: new Date() }).where(eq(task.id, id));
  }

  @TraceNode({ name: 'task.countForDashboard', type: 'method' })
  async countForDashboard(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    return database
      .select({ total: count() })
      .from(task)
      .where(and(...this.getTaskScopeConditions(scope)));
  }
  @TraceNode({ name: 'task.findDashboardTaskRows', type: 'method' })
  async findDashboardTaskRows(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    return database
      .select({ pymeId: task.pymeId, status: task.status })
      .from(task)
      .where(and(...this.getTaskScopeConditions(scope)));
  }
}
