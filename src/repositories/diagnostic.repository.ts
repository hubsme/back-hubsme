import { Injectable } from '@nestjs/common';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { diagnostic, DiagnosticDTO } from '@db/tables/diagnostic.table';

@Injectable()
export class DiagnosticRepository {
  async findAllPaginated(page: number = 1, limit: number = 10, filters?: { pymeId?: number }) {
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

  async findOne(id: number) {
    const result = await database
      .select()
      .from(diagnostic)
      .where(and(eq(diagnostic.id, id), isNull(diagnostic.deletedAt)));
    return result[0];
  }

  async create(data: DiagnosticDTO) {
    const result = await database.insert(diagnostic).values(data).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(diagnostic)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(diagnostic.id, id))
      .returning();
    return result[0];
  }
}
