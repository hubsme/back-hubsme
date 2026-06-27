import { Injectable } from '@nestjs/common';
import { eq, ilike, or, and, isNull, isNotNull, count, desc, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant, ConsultantDTO } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { task } from '@db/tables/task.table';

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
          ilike(consultant.fullName, `%${searchTerm}%`),
          ilike(consultant.firstName, `%${searchTerm}%`),
          ilike(consultant.lastName, `%${searchTerm}%`),
          ilike(consultant.headline, `%${searchTerm}%`),
          ilike(consultant.location, `%${searchTerm}%`),
          ilike(consultant.workModality, `%${searchTerm}%`),
          ilike(consultant.bio, `%${searchTerm}%`),
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

  async findByPymeMeetingsPaginated(
    pymeId: number,
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; active?: string; validated?: string; sector?: string },
  ) {
    const offset = (page - 1) * limit;
    const conditions = [
      or(isNotNull(meeting.id), isNotNull(task.id)),
      isNull(consultant.deletedAt),
    ];

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(consultant.fullName, `%${searchTerm}%`),
          ilike(consultant.firstName, `%${searchTerm}%`),
          ilike(consultant.lastName, `%${searchTerm}%`),
          ilike(consultant.headline, `%${searchTerm}%`),
          ilike(consultant.location, `%${searchTerm}%`),
          ilike(consultant.workModality, `%${searchTerm}%`),
          ilike(consultant.bio, `%${searchTerm}%`),
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

    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: sql<number>`count(distinct ${consultant.id})` })
      .from(consultant)
      .leftJoin(
        meeting,
        and(eq(meeting.consultantId, consultant.id), eq(meeting.pymeId, pymeId), isNull(meeting.deletedAt)),
      )
      .leftJoin(
        task,
        and(eq(task.consultantId, consultant.id), eq(task.pymeId, pymeId), isNull(task.deletedAt)),
      )
      .where(whereClause);

    const data = await database
      .selectDistinct({
        id: consultant.id,
        userId: consultant.id,
        fullName: consultant.fullName,
        firstName: consultant.firstName,
        lastName: consultant.lastName,
        ownerPhone: consultant.ownerPhone,
        headline: consultant.headline,
        location: consultant.location,
        workModality: consultant.workModality,
        linkedinUrl: consultant.linkedinUrl,
        bio: consultant.bio,
        specialties: consultant.specialties,
        sectors: consultant.sectors,
        industries: consultant.industries,
        companyTypes: consultant.companyTypes,
        services: consultant.services,
        yearsExperience: consultant.yearsExperience,
        education: consultant.education,
        certifications: consultant.certifications,
        workedSectors: consultant.workedSectors,
        caseStudies: consultant.caseStudies,
        cvText: consultant.cvText,
        photoUrl: consultant.photoUrl,
        videoUrl: consultant.videoUrl,
        pricePerHour: consultant.pricePerHour,
        rating: consultant.rating,
        totalReviews: consultant.totalReviews,
        active: consultant.active,
        validated: consultant.validated,
        createdAt: consultant.createdAt,
      })
      .from(consultant)
      .leftJoin(
        meeting,
        and(eq(meeting.consultantId, consultant.id), eq(meeting.pymeId, pymeId), isNull(meeting.deletedAt)),
      )
      .leftJoin(
        task,
        and(eq(task.consultantId, consultant.id), eq(task.pymeId, pymeId), isNull(task.deletedAt)),
      )
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
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async findByUserId(userId: number) {
    return this.findOne(userId);
  }

  async create(data: ConsultantDTO) {
    const result = await database.insert(consultant).values(data).returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async update(id: number, data: Partial<ConsultantDTO>) {
    const result = await database
      .update(consultant)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultant.id, id), isNull(consultant.deletedAt)))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }

  async delete(id: number) {
    const result = await database
      .update(consultant)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(consultant.id, id))
      .returning();
    return result[0] ? { ...result[0], userId: result[0].id } : undefined;
  }
}
