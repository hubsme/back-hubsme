import { database, transaction } from '@db/connection.db';
import { diagnostic } from '@db/tables/diagnostic.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class DiagnosticQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'diagnostic.findLatestDiagnostic', type: 'method' })
  async findLatestDiagnostic(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }): Promise<{
    id: number;
    createdAt: Date;
    score: number;
  } | null> {
    if (!scope.userId || scope.role !== 'pyme') return null;
    const [latestDiagnostic] = await database
      .select({ id: diagnostic.id, createdAt: diagnostic.createdAt, score: diagnostic.score })
      .from(diagnostic)
      .where(and(isNull(diagnostic.deletedAt), eq(diagnostic.pymeId, scope.userId)))
      .orderBy(desc(diagnostic.createdAt), desc(diagnostic.id))
      .limit(1);
    return latestDiagnostic ?? null;
  }

  @TraceNode({ name: 'diagnostic.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      pymeId?: number;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.pymeId) {
      conditions.push(eq(diagnostic.pymeId, filters.pymeId));
    }
    conditions.push(isNull(diagnostic.deletedAt));
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(diagnostic).where(whereClause);
    const data = await database
      .select()
      .from(diagnostic)
      .where(whereClause)
      .orderBy(desc(diagnostic.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'diagnostic.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(diagnostic)
      .where(and(eq(diagnostic.id, id), isNull(diagnostic.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'diagnostic.create', type: 'method' })
  async create(data: typeof diagnostic.$inferInsert) {
    const result = await database.insert(diagnostic).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'diagnostic.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(diagnostic)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(diagnostic.id, id))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'diagnostic.countForDashboard', type: 'method' })
  async countForDashboard(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    const conditions = [isNull(diagnostic.deletedAt)];
    if (scope.userId && scope.role === 'pyme') conditions.push(eq(diagnostic.pymeId, scope.userId));
    return database
      .select({ total: count() })
      .from(diagnostic)
      .where(and(...conditions));
  }
}
