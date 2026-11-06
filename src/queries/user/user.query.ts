import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { user, userRoleEnum } from '@db/tables/user.table';
import { and, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class UserQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'user.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      role?: (typeof userRoleEnum.enumValues)[number];
      isActive?: string;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(user.name, `%${searchTerm}%`),
          ilike(user.firstName, `%${searchTerm}%`),
          ilike(user.lastName, `%${searchTerm}%`),
          ilike(user.email, `%${searchTerm}%`),
        ),
      );
    }
    if (filters?.role) {
      conditions.push(eq(sql`${user.role}::text`, filters.role));
    }
    if (filters?.isActive) {
      conditions.push(eq(user.isActive, filters.isActive));
    }
    conditions.push(isNull(user.deletedAt));
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(user).where(whereClause);
    const data = await database
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'user.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.id, id), isNull(user.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'user.findByEmail', type: 'method' })
  async findByEmail(email: string) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.email, email), isNull(user.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'user.findByGoogleId', type: 'method' })
  async findByGoogleId(googleId: string) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.googleId, googleId), isNull(user.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'user.create', type: 'method' })
  async create(data: typeof user.$inferInsert) {
    const result = await database.insert(user).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'user.update', type: 'method' })
  async update(id: number, data: Partial<typeof user.$inferInsert>) {
    const result = await database
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(user.id, id), isNull(user.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'user.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(user)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    return result[0];
  }
}
