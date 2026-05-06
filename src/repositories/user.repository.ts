import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { user, UserDTO, userRoleEnum } from '@db/tables/user.table';

@Injectable()
export class UserRepository {
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
      conditions.push(or(ilike(user.name, `%${searchTerm}%`), ilike(user.email, `%${searchTerm}%`)));
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

  async findOne(id: number) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.id, id), isNull(user.deletedAt)));
    return result[0];
  }

  async findByEmail(email: string) {
    const result = await database
      .select()
      .from(user)
      .where(and(eq(user.email, email), isNull(user.deletedAt)));
    return result[0];
  }

  async create(data: UserDTO) {
    const result = await database.insert(user).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<UserDTO>) {
    const result = await database
      .update(user)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(user.id, id), isNull(user.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(user)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    return result[0];
  }
}
