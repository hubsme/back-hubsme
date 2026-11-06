import { and, desc, eq, ilike, isNotNull, isNull, or, sql } from 'drizzle-orm';

import { database } from '@db/connection.db';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { task } from '@db/tables/task.table';
import { user } from '@db/tables/user.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConsultantJoinQuery {
  @TraceNode({ name: 'consultant.findActiveNotificationRecipients', type: 'method' })
  async findActiveNotificationRecipients() {
    return database
      .select({
        id: consultant.id,
        fullName: consultant.fullName,
        ownerPhone: consultant.ownerPhone,
        userEmail: user.email,
      })
      .from(consultant)
      .innerJoin(user, and(eq(user.id, consultant.id), isNull(user.deletedAt)))
      .where(and(eq(consultant.active, 'true'), eq(user.isActive, 'true'), isNull(consultant.deletedAt)))
      .orderBy(consultant.id);
  }

  @TraceNode({ name: 'consultant.findByPymeMeetingsPaginated', type: 'method' })
  async findByPymeMeetingsPaginated(
    pymeId: number,
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
    const conditions = [or(isNotNull(meeting.id), isNotNull(task.id)), isNull(consultant.deletedAt)];
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
    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: sql<number>`count(distinct ${consultant.id})` })
      .from(consultant)
      .leftJoin(
        meeting,
        and(eq(meeting.consultantId, consultant.id), eq(meeting.pymeId, pymeId), isNull(meeting.deletedAt)),
      )
      .leftJoin(task, and(eq(task.consultantId, consultant.id), eq(task.pymeId, pymeId), isNull(task.deletedAt)))
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
        diagnosticAreas: consultant.diagnosticAreas,
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
        minimumBookingNoticeHours: consultant.minimumBookingNoticeHours,
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
      .leftJoin(task, and(eq(task.consultantId, consultant.id), eq(task.pymeId, pymeId), isNull(task.deletedAt)))
      .where(whereClause)
      .orderBy(desc(consultant.createdAt))
      .limit(limit)
      .offset(offset);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'consultant.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select({
        id: consultant.id,
        createdAt: consultant.createdAt,
        updatedAt: consultant.updatedAt,
        deletedAt: consultant.deletedAt,
        userId: consultant.id,
        userEmail: user.email,
        authProvider: user.authProvider,
        fullName: consultant.fullName,
        firstName: consultant.firstName,
        lastName: consultant.lastName,
        dni: consultant.dni,
        birthDate: consultant.birthDate,
        ownerPhone: consultant.ownerPhone,
        headline: consultant.headline,
        location: consultant.location,
        workModality: consultant.workModality,
        linkedinUrl: consultant.linkedinUrl,
        bio: consultant.bio,
        diagnosticAreas: consultant.diagnosticAreas,
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
        cvUrl: consultant.cvUrl,
        photoUrl: consultant.photoUrl,
        videoUrl: consultant.videoUrl,
        pricePerHour: consultant.pricePerHour,
        minimumBookingNoticeHours: consultant.minimumBookingNoticeHours,
        rating: consultant.rating,
        totalReviews: consultant.totalReviews,
        active: consultant.active,
        validated: consultant.validated,
      })
      .from(consultant)
      .innerJoin(user, and(eq(user.id, consultant.id), isNull(user.deletedAt)))
      .where(and(eq(consultant.id, id), isNull(consultant.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'consultant.findByUserId', type: 'method' })
  async findByUserId(userId: number) {
    return this.findOne(userId);
  }

  @TraceNode({ name: 'consultant.countActiveForPyme', type: 'method' })
  async countActiveForPyme(userId: number): Promise<number> {
    const [result] = await database
      .select({ total: sql<number>`count(distinct ${consultant.id})` })
      .from(consultant)
      .leftJoin(
        meeting,
        and(eq(meeting.consultantId, consultant.id), eq(meeting.pymeId, userId), isNull(meeting.deletedAt)),
      )
      .leftJoin(task, and(eq(task.consultantId, consultant.id), eq(task.pymeId, userId), isNull(task.deletedAt)))
      .where(and(or(isNotNull(meeting.id), isNotNull(task.id)), isNull(consultant.deletedAt)));
    return Number(result?.total ?? 0);
  }
}
