import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant } from '@db/tables/consultant.table';
import { consultantServiceOffer, ConsultantServiceOfferDTO } from '@db/tables/consultant-service-offer.table';
import type { ServiceRequestCategory } from '@db/tables/service-request.table';

export type ConsultantServiceOfferListFilters = {
  consultantId?: number;
  category?: ServiceRequestCategory;
  subcategory?: string;
  search?: string;
  isActive?: boolean;
  publicCatalog?: boolean;
};

const consultantServiceOfferSelection = {
  id: consultantServiceOffer.id,
  createdAt: consultantServiceOffer.createdAt,
  updatedAt: consultantServiceOffer.updatedAt,
  consultantId: consultantServiceOffer.consultantId,
  consultantName: consultant.fullName,
  consultantHeadline: consultant.headline,
  consultantPhotoUrl: consultant.photoUrl,
  consultantRating: consultant.rating,
  consultantYearsExperience: consultant.yearsExperience,
  title: consultantServiceOffer.title,
  category: consultantServiceOffer.category,
  subcategory: consultantServiceOffer.subcategory,
  description: consultantServiceOffer.description,
  expectedOutcome: consultantServiceOffer.expectedOutcome,
  requirements: consultantServiceOffer.requirements,
  deliverables: consultantServiceOffer.deliverables,
  exclusions: consultantServiceOffer.exclusions,
  estimatedDurationDays: consultantServiceOffer.estimatedDurationDays,
  workModality: consultantServiceOffer.workModality,
  workMethod: consultantServiceOffer.workMethod,
  price: consultantServiceOffer.price,
  currency: consultantServiceOffer.currency,
  pricePeriod: consultantServiceOffer.pricePeriod,
  isActive: consultantServiceOffer.isActive,
};

@Injectable()
export class ConsultantServiceOfferRepository {
  async findAllPaginated(page: number, limit: number, filters: ConsultantServiceOfferListFilters) {
    const conditions = [isNull(consultantServiceOffer.deletedAt), isNull(consultant.deletedAt)];
    const search = filters.search?.trim();

    if (filters.consultantId !== undefined) {
      conditions.push(eq(consultantServiceOffer.consultantId, filters.consultantId));
    }
    if (filters.category) conditions.push(eq(consultantServiceOffer.category, filters.category));
    if (filters.subcategory?.trim()) {
      conditions.push(eq(consultantServiceOffer.subcategory, filters.subcategory.trim()));
    }
    if (filters.isActive !== undefined) {
      conditions.push(eq(consultantServiceOffer.isActive, filters.isActive));
    }
    if (filters.publicCatalog) {
      conditions.push(
        eq(consultantServiceOffer.isActive, true),
        eq(consultant.active, 'true'),
        eq(consultant.validated, 'true'),
      );
    }
    if (search) {
      conditions.push(
        or(
          ilike(consultantServiceOffer.title, `%${search}%`),
          ilike(consultantServiceOffer.description, `%${search}%`),
          ilike(consultantServiceOffer.expectedOutcome, `%${search}%`),
          ilike(consultantServiceOffer.subcategory, `%${search}%`),
          ilike(consultant.fullName, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: count() })
      .from(consultantServiceOffer)
      .innerJoin(consultant, eq(consultantServiceOffer.consultantId, consultant.id))
      .where(whereClause);
    const data = await database
      .select(consultantServiceOfferSelection)
      .from(consultantServiceOffer)
      .innerJoin(consultant, eq(consultantServiceOffer.consultantId, consultant.id))
      .where(whereClause)
      .orderBy(desc(consultantServiceOffer.updatedAt), desc(consultantServiceOffer.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const [result] = await database
      .select(consultantServiceOfferSelection)
      .from(consultantServiceOffer)
      .innerJoin(consultant, eq(consultantServiceOffer.consultantId, consultant.id))
      .where(and(eq(consultantServiceOffer.id, id), isNull(consultantServiceOffer.deletedAt)));
    return result;
  }

  async create(data: ConsultantServiceOfferDTO) {
    const [created] = await database
      .insert(consultantServiceOffer)
      .values(data)
      .returning({ id: consultantServiceOffer.id });
    return created ? this.findOne(created.id) : undefined;
  }

  async update(id: number, data: Partial<ConsultantServiceOfferDTO>) {
    const [updated] = await database
      .update(consultantServiceOffer)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantServiceOffer.id, id), isNull(consultantServiceOffer.deletedAt)))
      .returning({ id: consultantServiceOffer.id });
    return updated ? this.findOne(updated.id) : undefined;
  }

  async delete(id: number) {
    return this.update(id, { deletedAt: new Date(), isActive: false });
  }
}
