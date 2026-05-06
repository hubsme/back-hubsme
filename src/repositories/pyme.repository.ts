import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, count, desc } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { pyme, PymeDTO } from '@db/tables/pyme.table';

@Injectable()
export class PymeRepository {
  async findAllPaginated(page: number = 1, limit: number = 10, filters?: { search?: string; sector?: string }) {
    const offset = (page - 1) * limit;
    const conditions = [];

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(or(ilike(pyme.name, `%${searchTerm}%`), ilike(pyme.ruc, `%${searchTerm}%`)));
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

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select()
      .from(pyme)
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)));
    return result[0];
  }

  async findByUserId(userId: number) {
    const result = await database
      .select()
      .from(pyme)
      .where(and(eq(pyme.userId, userId), isNull(pyme.deletedAt)));
    return result[0];
  }

  async create(data: PymeDTO) {
    const result = await database.insert(pyme).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<PymeDTO>) {
    const result = await database
      .update(pyme)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(pyme)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pyme.id, id))
      .returning();
    return result[0];
  }
}
