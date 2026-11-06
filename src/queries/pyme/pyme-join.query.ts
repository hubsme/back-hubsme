import { and, desc, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';

import { database } from '@db/connection.db';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { task } from '@db/tables/task.table';
import { user } from '@db/tables/user.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PymeJoinQuery {
  @TraceNode({ name: 'pyme.findByConsultantMeetingsPaginated', type: 'method' })
  async findByConsultantMeetingsPaginated(
    consultantId: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      sector?: string;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [or(isNotNull(meeting.id), isNotNull(task.id)), isNull(pyme.deletedAt)];
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(pyme.name, `%${searchTerm}%`),
          ilike(pyme.ruc, `%${searchTerm}%`),
          ilike(pyme.ownerFirstName, `%${searchTerm}%`),
          ilike(pyme.ownerLastName, `%${searchTerm}%`),
          ilike(pyme.ownerEmail, `%${searchTerm}%`),
        ),
      );
    }
    if (filters?.sector) {
      conditions.push(ilike(pyme.sector, `%${filters.sector.trim()}%`));
    }
    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: sql<number>`count(distinct ${pyme.id})` })
      .from(pyme)
      .leftJoin(
        meeting,
        and(eq(meeting.pymeId, pyme.id), eq(meeting.consultantId, consultantId), isNull(meeting.deletedAt)),
      )
      .leftJoin(task, and(eq(task.pymeId, pyme.id), eq(task.consultantId, consultantId), isNull(task.deletedAt)))
      .where(whereClause);
    const data = await database
      .selectDistinct({
        id: pyme.id,
        userId: pyme.id,
        name: pyme.name,
        ruc: pyme.ruc,
        ownerFirstName: pyme.ownerFirstName,
        ownerLastName: pyme.ownerLastName,
        ownerEmail: pyme.ownerEmail,
        sector: pyme.sector,
        numEmployees: pyme.numEmployees,
        logoUrl: pyme.logoUrl,
        createdAt: pyme.createdAt,
      })
      .from(pyme)
      .leftJoin(
        meeting,
        and(eq(meeting.pymeId, pyme.id), eq(meeting.consultantId, consultantId), isNull(meeting.deletedAt)),
      )
      .leftJoin(task, and(eq(task.pymeId, pyme.id), eq(task.consultantId, consultantId), isNull(task.deletedAt)))
      .where(whereClause)
      .orderBy(desc(pyme.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'pyme.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select({
        id: pyme.id,
        createdAt: pyme.createdAt,
        updatedAt: pyme.updatedAt,
        deletedAt: pyme.deletedAt,
        userId: pyme.id,
        userEmail: user.email,
        authProvider: user.authProvider,
        name: pyme.name,
        ruc: pyme.ruc,
        ownerFirstName: pyme.ownerFirstName,
        ownerLastName: pyme.ownerLastName,
        ownerEmail: pyme.ownerEmail,
        ownerPhone: pyme.ownerPhone,
        ownerPosition: pyme.ownerPosition,
        sector: pyme.sector,
        numEmployees: pyme.numEmployees,
        yearsInOperation: pyme.yearsInOperation,
        description: pyme.description,
        logoUrl: pyme.logoUrl,
      })
      .from(pyme)
      .innerJoin(user, and(eq(user.id, pyme.id), isNull(user.deletedAt)))
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'pyme.findByUserId', type: 'method' })
  async findByUserId(userId: number) {
    return this.findOne(userId);
  }

  @TraceNode({ name: 'pyme.countActiveForConsultant', type: 'method' })
  async countActiveForConsultant(userId: number): Promise<number> {
    const [result] = await database
      .select({ total: sql<number>`count(distinct ${pyme.id})` })
      .from(pyme)
      .leftJoin(meeting, and(eq(meeting.pymeId, pyme.id), eq(meeting.consultantId, userId), isNull(meeting.deletedAt)))
      .leftJoin(task, and(eq(task.pymeId, pyme.id), eq(task.consultantId, userId), isNull(task.deletedAt)))
      .where(and(or(isNotNull(meeting.id), isNotNull(task.id)), isNull(pyme.deletedAt)));
    return Number(result?.total ?? 0);
  }
}
