import { Injectable } from '@nestjs/common';
import { eq, and, isNull, count, desc, exists, ilike, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { diagnostic, DiagnosticDTO } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';

@Injectable()
export class DiagnosticRepository {
  async findPymeDocumentsPaginated(
    pymeId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const offset = (page - 1) * limit;
    const conditions = [isNull(diagnostic.deletedAt), eq(diagnostic.pymeId, pymeId)];
    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      const searchTerm = `%${normalizedSearch}%`;
      conditions.push(
        or(
          ilike(diagnostic.summary, searchTerm),
          sql<boolean>`${diagnostic.result}->>'feedbackIa' ILIKE ${searchTerm}`,
        ),
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(diagnostic).where(whereClause);
    const data = await database
      .select({
        id: diagnostic.id,
        pymeId: diagnostic.pymeId,
        pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
        pymeLogoUrl: pyme.logoUrl,
        createdAt: diagnostic.createdAt,
        summary: diagnostic.summary,
        result: diagnostic.result,
        score: diagnostic.score,
      })
      .from(diagnostic)
      .leftJoin(pyme, eq(pyme.id, diagnostic.pymeId))
      .where(whereClause)
      .orderBy(desc(diagnostic.createdAt), desc(diagnostic.id))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findConsultantDocumentsPaginated(
    consultantId: number,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ) {
    const offset = (page - 1) * limit;
    const consultantMeeting = database
      .select({ id: meeting.id })
      .from(meeting)
      .where(and(eq(meeting.pymeId, diagnostic.pymeId), eq(meeting.consultantId, consultantId), isNull(meeting.deletedAt)));
    const conditions = [isNull(diagnostic.deletedAt), exists(consultantMeeting)];
    const normalizedSearch = search?.trim();

    if (normalizedSearch) {
      const searchTerm = `%${normalizedSearch}%`;
      conditions.push(
        or(
          ilike(diagnostic.summary, searchTerm),
          ilike(pyme.name, searchTerm),
          sql<boolean>`${diagnostic.result}->>'feedbackIa' ILIKE ${searchTerm}`,
        ),
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: count() })
      .from(diagnostic)
      .leftJoin(pyme, eq(pyme.id, diagnostic.pymeId))
      .where(whereClause);
    const data = await database
      .select({
        id: diagnostic.id,
        pymeId: diagnostic.pymeId,
        pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
        pymeLogoUrl: pyme.logoUrl,
        createdAt: diagnostic.createdAt,
        summary: diagnostic.summary,
        result: diagnostic.result,
        score: diagnostic.score,
      })
      .from(diagnostic)
      .leftJoin(pyme, eq(pyme.id, diagnostic.pymeId))
      .where(whereClause)
      .orderBy(desc(diagnostic.createdAt), desc(diagnostic.id))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

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
