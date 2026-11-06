import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { diagnostic } from '@db/tables/diagnostic.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { and, count, desc, eq, exists, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class DiagnosticJoinQuery {
  @TraceNode({ name: 'diagnostic.findPymeDocumentsPaginated', type: 'method' })
  async findPymeDocumentsPaginated(pymeId: number, page: number = 1, limit: number = 10, search?: string) {
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

  @TraceNode({ name: 'diagnostic.findConsultantDocumentsPaginated', type: 'method' })
  async findConsultantDocumentsPaginated(consultantId: number, page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;
    const consultantMeeting = database
      .select({ id: meeting.id })
      .from(meeting)
      .where(
        and(eq(meeting.pymeId, diagnostic.pymeId), eq(meeting.consultantId, consultantId), isNull(meeting.deletedAt)),
      );
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
}
