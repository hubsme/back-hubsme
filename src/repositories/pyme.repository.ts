import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { pyme, PymeDTO } from '@db/tables/pyme.table';
import { meeting } from '@db/tables/meeting.table';

@Injectable()
export class PymeRepository {
  async findAllPaginated(page: number = 1, limit: number = 10, filters?: { search?: string; sector?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

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

    conditions.push(isNull(pyme.deletedAt));
    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(pyme).where(whereClause);
    const data = await database
      .select()
      .from(pyme)
      .where(whereClause)
      .orderBy(desc(pyme.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((item) => ({ ...item, userId: item.id })),
      total: Number(total),
    };
  }

  async findByConsultantMeetingsPaginated(
    consultantId: number,
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; sector?: string },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [eq(meeting.consultantId, consultantId), isNull(meeting.deletedAt), isNull(pyme.deletedAt)];

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
      .innerJoin(meeting, eq(meeting.pymeId, pyme.id))
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
        createdAt: pyme.createdAt,
      })
      .from(pyme)
      .innerJoin(meeting, eq(meeting.pymeId, pyme.id))
      .where(whereClause)
      .orderBy(desc(pyme.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(pyme)
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)));
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async findByUserId(userId: number) {
    return this.findOne(userId);
  }

  async create(data: PymeDTO) {
    const result = await database.insert(pyme).values(data).returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async update(id: number, data: Partial<PymeDTO>) {
    const result = await database
      .update(pyme)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async delete(id: number) {
    const result = await database
      .update(pyme)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pyme.id, id))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }
}
