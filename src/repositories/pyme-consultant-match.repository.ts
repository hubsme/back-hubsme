import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  pymeConsultantMatch,
  PymeConsultantMatchDTO,
  pymeConsultantMatchStatusEnum,
} from '@db/tables/pyme-consultant-match.table';
import { consultant } from '@db/tables/consultant.table';
import { pyme } from '@db/tables/pyme.table';

interface PymeConsultantMatchFilters {
  search?: string;
  pymeId?: number;
  consultantId?: number;
  status?: (typeof pymeConsultantMatchStatusEnum.enumValues)[number];
}

@Injectable()
export class PymeConsultantMatchRepository {
  async findAllPaginated(page: number = 1, limit: number = 10, filters?: PymeConsultantMatchFilters) {
    const offset = (page - 1) * limit;
    const conditions = [isNull(pymeConsultantMatch.deletedAt)];

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      conditions.push(
        or(
          ilike(pyme.name, `%${searchTerm}%`),
          ilike(pyme.sector, `%${searchTerm}%`),
          ilike(consultant.fullName, `%${searchTerm}%`),
          sql`${consultant.specialties}::text ILIKE ${`%${searchTerm}%`}`,
        ),
      );
    }

    if (filters?.pymeId) {
      conditions.push(eq(pymeConsultantMatch.pymeId, filters.pymeId));
    }

    if (filters?.consultantId) {
      conditions.push(eq(pymeConsultantMatch.consultantId, filters.consultantId));
    }

    if (filters?.status) {
      conditions.push(eq(sql`${pymeConsultantMatch.status}::text`, filters.status));
    }

    const whereClause = and(...conditions);

    const [{ total }] = await database
      .select({ total: count() })
      .from(pymeConsultantMatch)
      .leftJoin(pyme, eq(pymeConsultantMatch.pymeId, pyme.userId))
      .leftJoin(consultant, eq(pymeConsultantMatch.consultantId, consultant.userId))
      .where(whereClause);

    const data = await database
      .select({
        id: pymeConsultantMatch.id,
        createdAt: pymeConsultantMatch.createdAt,
        updatedAt: pymeConsultantMatch.updatedAt,
        deletedAt: pymeConsultantMatch.deletedAt,
        pymeId: pymeConsultantMatch.pymeId,
        pymeName: pyme.name,
        pymeSector: pyme.sector,
        pymeNumEmployees: pyme.numEmployees,
        pymeYearsInOperation: pyme.yearsInOperation,
        pymeDescription: pyme.description,
        pymeLogoUrl: pyme.logoUrl,
        consultantId: pymeConsultantMatch.consultantId,
        consultantName: consultant.fullName,
        consultantBio: consultant.bio,
        consultantSpecialties: consultant.specialties,
        consultantPhotoUrl: consultant.photoUrl,
        consultantPricePerHour: consultant.pricePerHour,
        consultantRating: consultant.rating,
        status: pymeConsultantMatch.status,
        source: pymeConsultantMatch.source,
        notes: pymeConsultantMatch.notes,
      })
      .from(pymeConsultantMatch)
      .leftJoin(pyme, eq(pymeConsultantMatch.pymeId, pyme.userId))
      .leftJoin(consultant, eq(pymeConsultantMatch.consultantId, consultant.userId))
      .where(whereClause)
      .orderBy(desc(pymeConsultantMatch.createdAt))
      .limit(limit)
      .offset(offset);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select({
        id: pymeConsultantMatch.id,
        createdAt: pymeConsultantMatch.createdAt,
        updatedAt: pymeConsultantMatch.updatedAt,
        deletedAt: pymeConsultantMatch.deletedAt,
        pymeId: pymeConsultantMatch.pymeId,
        pymeName: pyme.name,
        pymeSector: pyme.sector,
        pymeNumEmployees: pyme.numEmployees,
        pymeYearsInOperation: pyme.yearsInOperation,
        pymeDescription: pyme.description,
        pymeLogoUrl: pyme.logoUrl,
        consultantId: pymeConsultantMatch.consultantId,
        consultantName: consultant.fullName,
        consultantBio: consultant.bio,
        consultantSpecialties: consultant.specialties,
        consultantPhotoUrl: consultant.photoUrl,
        consultantPricePerHour: consultant.pricePerHour,
        consultantRating: consultant.rating,
        status: pymeConsultantMatch.status,
        source: pymeConsultantMatch.source,
        notes: pymeConsultantMatch.notes,
      })
      .from(pymeConsultantMatch)
      .leftJoin(pyme, eq(pymeConsultantMatch.pymeId, pyme.userId))
      .leftJoin(consultant, eq(pymeConsultantMatch.consultantId, consultant.userId))
      .where(and(eq(pymeConsultantMatch.id, id), isNull(pymeConsultantMatch.deletedAt)));
    return result[0];
  }

  async findAcceptedByPair(pymeId: number, consultantId: number) {
    const result = await database
      .select()
      .from(pymeConsultantMatch)
      .where(
        and(
          eq(pymeConsultantMatch.pymeId, pymeId),
          eq(pymeConsultantMatch.consultantId, consultantId),
          eq(sql`${pymeConsultantMatch.status}::text`, 'aceptado'),
          isNull(pymeConsultantMatch.deletedAt),
        ),
      );
    return result[0];
  }

  async findByPair(pymeId: number, consultantId: number) {
    const result = await database
      .select()
      .from(pymeConsultantMatch)
      .where(
        and(
          eq(pymeConsultantMatch.pymeId, pymeId),
          eq(pymeConsultantMatch.consultantId, consultantId),
          isNull(pymeConsultantMatch.deletedAt),
        ),
      );
    return result[0];
  }

  async create(data: PymeConsultantMatchDTO) {
    const result = await database.insert(pymeConsultantMatch).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<PymeConsultantMatchDTO>) {
    const result = await database
      .update(pymeConsultantMatch)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(pymeConsultantMatch.id, id), isNull(pymeConsultantMatch.deletedAt)))
      .returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await database
      .update(pymeConsultantMatch)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(pymeConsultantMatch.id, id))
      .returning();
    return result[0];
  }
}
