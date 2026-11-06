import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { pyme } from '@db/tables/pyme.table';
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';

@Injectable()
export class PymeQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'pyme.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      sector?: string;
    },
  ) {
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

  @TraceNode({ name: 'pyme.create', type: 'method' })
  async create(data: typeof pyme.$inferInsert) {
    const result = await database.insert(pyme).values(data).returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  @TraceNode({ name: 'pyme.update', type: 'method' })
  async update(id: number, data: Partial<typeof pyme.$inferInsert>) {
    const result = await database
      .update(pyme)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pyme.id, id), isNull(pyme.deletedAt)))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  @TraceNode({ name: 'pyme.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(pyme)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pyme.id, id))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }
}
