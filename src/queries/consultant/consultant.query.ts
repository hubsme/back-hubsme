import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultant } from '@db/tables/consultant.table';
import { and, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class ConsultantQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'consultant.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      active?: string;
      validated?: string;
      sector?: string;
    },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [];
    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(consultant.fullName, `%${searchTerm}%`),
          ilike(consultant.firstName, `%${searchTerm}%`),
          ilike(consultant.lastName, `%${searchTerm}%`),
          ilike(consultant.headline, `%${searchTerm}%`),
          ilike(consultant.location, `%${searchTerm}%`),
          sql`CASE WHEN ${consultant.workModality}::text = 'remote' THEN 'Remoto' ELSE ${consultant.workModality}::text END ILIKE ${`%${searchTerm}%`}`,
          ilike(consultant.bio, `%${searchTerm}%`),
          sql`${consultant.diagnosticAreas}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.specialties}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.sectors}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.industries}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.companyTypes}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.services}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.certifications}::text ILIKE ${`%${searchTerm}%`}`,
          sql`${consultant.workedSectors}::text ILIKE ${`%${searchTerm}%`}`,
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
    return {
      data: data.map((item) => ({ ...item, userId: item.id })),
      total: Number(total),
    };
  }

  @TraceNode({ name: 'consultant.findAvailableByUserIds', type: 'method' })
  async findAvailableByUserIds(userIds: number[]) {
    if (!userIds.length) return [];
    return database
      .select({ id: consultant.id })
      .from(consultant)
      .where(
        and(
          inArray(consultant.id, userIds),
          eq(consultant.active, 'true'),
          eq(consultant.validated, 'true'),
          isNull(consultant.deletedAt),
        ),
      );
  }

  @TraceNode({ name: 'consultant.findAvailableForAiMatching', type: 'method' })
  async findAvailableForAiMatching(limit: number = 100) {
    return database
      .select({
        id: consultant.id,
        userId: consultant.id,
        fullName: consultant.fullName,
        headline: consultant.headline,
        bio: consultant.bio,
        photoUrl: consultant.photoUrl,
        diagnosticAreas: consultant.diagnosticAreas,
        specialties: consultant.specialties,
        sectors: consultant.sectors,
        industries: consultant.industries,
        companyTypes: consultant.companyTypes,
        services: consultant.services,
        yearsExperience: consultant.yearsExperience,
        pricePerHour: consultant.pricePerHour,
        rating: consultant.rating,
        totalReviews: consultant.totalReviews,
      })
      .from(consultant)
      .where(and(eq(consultant.active, 'true'), eq(consultant.validated, 'true'), isNull(consultant.deletedAt)))
      .orderBy(desc(consultant.rating), desc(consultant.yearsExperience), desc(consultant.totalReviews))
      .limit(Math.min(Math.max(limit, 3), 100));
  }

  @TraceNode({ name: 'consultant.create', type: 'method' })
  async create(data: typeof consultant.$inferInsert) {
    const result = await database.insert(consultant).values(data).returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  @TraceNode({ name: 'consultant.update', type: 'method' })
  async update(id: number, data: Partial<typeof consultant.$inferInsert>) {
    const result = await database
      .update(consultant)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultant.id, id), isNull(consultant.deletedAt)))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  @TraceNode({ name: 'consultant.delete', type: 'method' })
  async delete(id: number) {
    const result = await database
      .update(consultant)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(consultant.id, id))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }
}
