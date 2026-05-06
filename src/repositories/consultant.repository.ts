import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant, ConsultantDTO } from '@db/tables/consultant.table';

@Injectable()
export class ConsultantRepository {
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; active?: string; validated?: string; sector?: string },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(consultant.name, `%${searchTerm}%`),
          ilike(consultant.bio, `%${searchTerm}%`),
          sql`${consultant.specialties}::text ILIKE ${`%${searchTerm}%`}`,
        ),
      );
    }

    if (filters?.active) {
      conditions.push(eq(consultant.active, filters.active));
    }

    if (filters?.validated) {
      conditions.push(eq(consultant.validated, filters.validated));
    }

    if (filters?.sector) {
      conditions.push(sql`${consultant.sectors}::text ILIKE ${`%${filters.sector.trim()}%`}`);
    }

    conditions.push(isNull(consultant.deletedAt));
    const whereClause = and(...conditions);

    const [{ total }] = await database.select({ total: count() }).from(consultant).where(whereClause);
    const data = await database
      .select()
      .from(consultant)
      .where(whereClause)
      .orderBy(desc(consultant.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(consultant)
      .where(and(eq(consultant.id, id), isNull(consultant.deletedAt)));
    return result[0];
  }

  async findByUserId(userId: number) {
    const result = await database
      .select()
      .from(consultant)
      .where(and(eq(consultant.userId, userId), isNull(consultant.deletedAt)));
    return result[0];
  }

  async create(data: ConsultantDTO) {
    const result = await database.insert(consultant).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<ConsultantDTO>) {
    const result = await database
      .update(consultant)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultant.id, id), isNull(consultant.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(consultant)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(consultant.id, id))
      .returning();
    return result[0];
  }
}
