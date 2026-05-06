import { Injectable } from '@nestjs/common';
import { eq, ilike, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { task, TaskDTO, taskAssignedToEnum, taskPriorityEnum, taskStatusEnum } from '@db/tables/task.table';

@Injectable()
export class TaskRepository {
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
      .select()
      .from(task)
      .where(whereClause)
      .orderBy(desc(task.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(task)
      .where(and(eq(task.id, id), isNull(task.deletedAt)));
    return result[0];
  }

  async create(data: TaskDTO) {
    const result = await database.insert(task).values(data).returning();
    return result[0];
  }

  async createMany(data: TaskDTO[]) {
    if (data.length === 0) return [];
    return await database.insert(task).values(data).returning();
  }

  async update(id: number, data: Partial<TaskDTO>) {
    const result = await database
      .update(task)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(task.id, id), isNull(task.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(task)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(task.id, id))
      .returning();
    return result[0];
  }
}
