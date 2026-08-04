import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant } from '@db/tables/consultant.table';
import { pyme } from '@db/tables/pyme.table';
import { serviceRequest, ServiceRequestDTO, serviceRequestStatusEnum } from '@db/tables/service-request.table';

export type ServiceRequestListFilters = {
  userId: number;
  role: 'pyme' | 'consultor';
  stage?: 'requests' | 'proposals';
  status?: (typeof serviceRequestStatusEnum.enumValues)[number];
  search?: string;
};

const serviceRequestSelection = {
  id: serviceRequest.id,
  createdAt: serviceRequest.createdAt,
  updatedAt: serviceRequest.updatedAt,
  pymeId: serviceRequest.pymeId,
  consultantId: serviceRequest.consultantId,
  pymeName: pyme.name,
  consultantName: consultant.fullName,
  consultantHeadline: consultant.headline,
  consultantPhotoUrl: consultant.photoUrl,
  title: serviceRequest.title,
  description: serviceRequest.description,
  requirements: serviceRequest.requirements,
  details: serviceRequest.details,
  status: serviceRequest.status,
  proposedPrice: serviceRequest.proposedPrice,
  currency: serviceRequest.currency,
  proposalMessage: serviceRequest.proposalMessage,
  pymeDecisionMessage: serviceRequest.pymeDecisionMessage,
  respondedAt: serviceRequest.respondedAt,
  decidedAt: serviceRequest.decidedAt,
  paidAt: serviceRequest.paidAt,
};

const requestStatuses = ['requested', 'consultant_declined', 'cancelled'] as const;
const proposalStatuses = ['proposal_sent', 'payment_pending', 'paid', 'pyme_declined'] as const;

@Injectable()
export class ServiceRequestRepository {
  async findAllPaginated(page: number, limit: number, filters: ServiceRequestListFilters) {
    const participantCondition =
      filters.role === 'pyme'
        ? eq(serviceRequest.pymeId, filters.userId)
        : eq(serviceRequest.consultantId, filters.userId);
    const conditions = [isNull(serviceRequest.deletedAt), participantCondition];
    const search = filters.search?.trim();

    if (filters.stage === 'requests') {
      conditions.push(inArray(serviceRequest.status, [...requestStatuses]));
    } else if (filters.stage === 'proposals') {
      conditions.push(inArray(serviceRequest.status, [...proposalStatuses]));
    }
    if (filters.status) conditions.push(eq(serviceRequest.status, filters.status));
    if (search) {
      conditions.push(
        or(
          ilike(serviceRequest.title, `%${search}%`),
          ilike(serviceRequest.description, `%${search}%`),
          ilike(serviceRequest.requirements, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(serviceRequest).where(whereClause);
    const data = await database
      .select(serviceRequestSelection)
      .from(serviceRequest)
      .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
      .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
      .where(whereClause)
      .orderBy(desc(serviceRequest.updatedAt), desc(serviceRequest.id))
      .limit(limit)
      .offset((page - 1) * limit);

    return { data, total: Number(total) };
  }

  async findOne(id: number) {
    const result = await database
      .select(serviceRequestSelection)
      .from(serviceRequest)
      .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
      .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
      .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)));
    return result[0];
  }

  async createMany(data: ServiceRequestDTO[]) {
    if (!data.length) return [];
    const inserted = await database.transaction((transaction) =>
      transaction.insert(serviceRequest).values(data).returning({ id: serviceRequest.id }),
    );
    return Promise.all(inserted.map((item) => this.findOne(item.id))).then((items) => items.filter(Boolean));
  }

  async update(
    id: number,
    data: Partial<ServiceRequestDTO>,
    expectedStatuses?: Array<(typeof serviceRequestStatusEnum.enumValues)[number]>,
  ) {
    const conditions = [eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)];
    if (expectedStatuses?.length) conditions.push(inArray(serviceRequest.status, expectedStatuses));

    const result = await database
      .update(serviceRequest)
      .set({ ...data, updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: serviceRequest.id });
    return result[0] ? this.findOne(result[0].id) : undefined;
  }
}
