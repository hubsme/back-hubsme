import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultantAvailability } from '@db/tables/consultant-availability.table';
import { and, count, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';

@Injectable()
export class ConsultantAvailabilityQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'consultant-availability.findByConsultantsAndMonths', type: 'method' })
  async findByConsultantsAndMonths(consultantIds: number[], months: Date[]) {
    if (!consultantIds.length || !months.length) return [];
    return database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          inArray(consultantAvailability.consultantId, consultantIds),
          inArray(consultantAvailability.month, months),
          isNull(consultantAvailability.deletedAt),
        ),
      );
  }

  @TraceNode({ name: 'consultant-availability.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      consultantId?: number;
      startFrom?: Date;
      startTo?: Date;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = this.buildConditions(filters);
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(consultantAvailability).where(whereClause);
    const data = await database
      .select()
      .from(consultantAvailability)
      .where(whereClause)
      .orderBy(desc(consultantAvailability.month))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'consultant-availability.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(and(eq(consultantAvailability.id, id), isNull(consultantAvailability.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'consultant-availability.findByMonth', type: 'method' })
  async findByMonth(consultantId: number, month: Date) {
    const result = await database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          eq(consultantAvailability.month, month),
          isNull(consultantAvailability.deletedAt),
        ),
      );
    return result[0];
  }

  @TraceNode({ name: 'consultant-availability.findByMonthRange', type: 'method' })
  async findByMonthRange(consultantId: number, startMonth: Date, endMonth: Date) {
    return database
      .select()
      .from(consultantAvailability)
      .where(
        and(
          eq(consultantAvailability.consultantId, consultantId),
          gte(consultantAvailability.month, startMonth),
          lte(consultantAvailability.month, endMonth),
          isNull(consultantAvailability.deletedAt),
        ),
      )
      .orderBy(consultantAvailability.month);
  }

  @TraceNode({ name: 'consultant-availability.create', type: 'method' })
  async create(data: typeof consultantAvailability.$inferInsert) {
    const result = await database.insert(consultantAvailability).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-availability.upsertMonth', type: 'method' })
  async upsertMonth(consultantId: number, month: Date, availableSchedule: Record<string, string[]>) {
    const current = await this.findByMonth(consultantId, month);
    if (current) {
      const result = await database
        .update(consultantAvailability)
        .set({ availableSchedule, updatedAt: new Date() })
        .where(and(eq(consultantAvailability.id, current.id), isNull(consultantAvailability.deletedAt)))
        .returning();
      return result[0];
    }
    return this.create({ consultantId, month, availableSchedule });
  }

  @TraceNode({ name: 'consultant-availability.update', type: 'method' })
  async update(id: number, data: Partial<typeof consultantAvailability.$inferInsert>) {
    const result = await database
      .update(consultantAvailability)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantAvailability.id, id), isNull(consultantAvailability.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-availability.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(consultantAvailability)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(consultantAvailability.id, id))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-availability.buildConditions', type: 'method' })
  private buildConditions(filters?: { consultantId?: number; startFrom?: Date; startTo?: Date }) {
    const conditions = [];
    if (filters?.consultantId) {
      conditions.push(eq(consultantAvailability.consultantId, filters.consultantId));
    }
    if (filters?.startFrom) {
      conditions.push(gte(consultantAvailability.month, this.getMonthStart(filters.startFrom)));
    }
    if (filters?.startTo) {
      conditions.push(lte(consultantAvailability.month, this.getMonthStart(filters.startTo)));
    }
    conditions.push(isNull(consultantAvailability.deletedAt));
    return conditions;
  }

  @TraceNode({ name: 'consultant-availability.getMonthStart', type: 'method' })
  private getMonthStart(date: Date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }
}
