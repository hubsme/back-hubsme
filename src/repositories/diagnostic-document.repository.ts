import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, isNull, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  diagnosticDocument,
  DiagnosticDocumentDTO,
  diagnosticDocumentTypeEnum,
} from '@db/tables/diagnostic-document.table';

@Injectable()
export class DiagnosticDocumentRepository {
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      diagnosticId?: number;
      pymeId?: number;
      type?: (typeof diagnosticDocumentTypeEnum.enumValues)[number];
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.search) {
      const search = `%${filters.search.trim()}%`;
      conditions.push(ilike(diagnosticDocument.title, search));
    }

    if (filters?.diagnosticId) {
      conditions.push(eq(diagnosticDocument.diagnosticId, filters.diagnosticId));
    }

    if (filters?.pymeId) {
      conditions.push(eq(diagnosticDocument.pymeId, filters.pymeId));
    }

    if (filters?.type) {
      conditions.push(eq(sql`${diagnosticDocument.type}::text`, filters.type));
    }

    conditions.push(isNull(diagnosticDocument.deletedAt));
    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(diagnosticDocument).where(whereClause);
    const data = await database
      .select()
      .from(diagnosticDocument)
      .where(whereClause)
      .orderBy(desc(diagnosticDocument.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(diagnosticDocument)
      .where(and(eq(diagnosticDocument.id, id), isNull(diagnosticDocument.deletedAt)));
    return result[0];
  }

  async create(data: DiagnosticDocumentDTO) {
    const result = await database.insert(diagnosticDocument).values(data).returning();
    return result[0];
  }

  async createMany(data: DiagnosticDocumentDTO[]) {
    if (data.length === 0) return [];
    return await database.insert(diagnosticDocument).values(data).returning();
  }

  async delete(id: number) {
    const result = await database
      .update(diagnosticDocument)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(diagnosticDocument.id, id))
      .returning();
    return result[0];
  }
}
