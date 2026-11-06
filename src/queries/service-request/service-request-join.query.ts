import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultant } from '@db/tables/consultant.table';
import { pyme } from '@db/tables/pyme.table';
import { serviceRequest } from '@db/tables/service-request.table';
import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm';

@Injectable()
export class ServiceRequestJoinQuery {
  private readonly serviceRequestSelection = {
    id: serviceRequest.id,
    createdAt: serviceRequest.createdAt,
    updatedAt: serviceRequest.updatedAt,
    pymeId: serviceRequest.pymeId,
    consultantId: serviceRequest.consultantId,
    serviceOfferId: serviceRequest.serviceOfferId,
    pymeName: pyme.name,
    consultantName: consultant.fullName,
    consultantHeadline: consultant.headline,
    consultantPhotoUrl: consultant.photoUrl,
    title: serviceRequest.title,
    category: serviceRequest.category,
    subcategory: serviceRequest.subcategory,
    description: serviceRequest.description,
    expectedOutcome: serviceRequest.expectedOutcome,
    requirements: serviceRequest.requirements,
    deliverables: serviceRequest.deliverables,
    exclusions: serviceRequest.exclusions,
    referenceUrls: serviceRequest.referenceUrls,
    referenceAttachments: serviceRequest.referenceAttachments,
    evidenceAttachments: serviceRequest.evidenceAttachments,
    budgetType: serviceRequest.budgetType,
    budgetMin: serviceRequest.budgetMin,
    budgetMax: serviceRequest.budgetMax,
    deadline: serviceRequest.deadline,
    estimatedDuration: serviceRequest.estimatedDuration,
    workModality: serviceRequest.workModality,
    workMethod: serviceRequest.workMethod,
    milestones: serviceRequest.milestones,
    paymentPlan: serviceRequest.paymentPlan,
    initialMeetingProposedStartTimes: serviceRequest.initialMeetingProposedStartTimes,
    initialMeetingStartTime: serviceRequest.initialMeetingStartTime,
    details: serviceRequest.details,
    status: serviceRequest.status,
    proposedPrice: serviceRequest.proposedPrice,
    currency: serviceRequest.currency,
    proposalMessage: serviceRequest.proposalMessage,
    pymeDecisionMessage: serviceRequest.pymeDecisionMessage,
    respondedAt: serviceRequest.respondedAt,
    decidedAt: serviceRequest.decidedAt,
    paidAt: serviceRequest.paidAt,
    completedAt: serviceRequest.completedAt,
  };

  private readonly requestStatuses = ['requested', 'consultant_declined', 'cancelled'] as const;

  private readonly proposalStatuses = [
    'proposal_sent',
    'payment_pending',
    'paid',
    'completed',
    'pyme_declined',
  ] as const;

  @TraceNode({ name: 'service-request.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number,
    limit: number,
    filters: {
      userId: number;
      role: 'pyme' | 'consultor';
      stage?: 'requests' | 'proposals';
      status?: (typeof serviceRequest.$inferSelect)['status'];
      search?: string;
    },
  ) {
    const participantCondition =
      filters.role === 'pyme'
        ? eq(serviceRequest.pymeId, filters.userId)
        : eq(serviceRequest.consultantId, filters.userId);
    const conditions = [isNull(serviceRequest.deletedAt), participantCondition];
    const search = filters.search?.trim();
    if (filters.stage === 'requests') {
      conditions.push(inArray(serviceRequest.status, [...this.requestStatuses]));
    } else if (filters.stage === 'proposals') {
      conditions.push(inArray(serviceRequest.status, [...this.proposalStatuses]));
    }
    if (filters.status) conditions.push(eq(serviceRequest.status, filters.status));
    if (search) {
      conditions.push(
        or(
          ilike(serviceRequest.title, `%${search}%`),
          ilike(serviceRequest.description, `%${search}%`),
          ilike(serviceRequest.requirements, `%${search}%`),
          ilike(serviceRequest.subcategory, `%${search}%`),
          ilike(serviceRequest.expectedOutcome, `%${search}%`),
        )!,
      );
    }
    const whereClause = and(...conditions);
    const [{ total }] = await database.select({ total: count() }).from(serviceRequest).where(whereClause);
    const data = await database
      .select(this.serviceRequestSelection)
      .from(serviceRequest)
      .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
      .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
      .where(whereClause)
      .orderBy(desc(serviceRequest.updatedAt), desc(serviceRequest.id))
      .limit(limit)
      .offset((page - 1) * limit);
    return { data, total: Number(total) };
  }

  @TraceNode({ name: 'service-request.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select(this.serviceRequestSelection)
      .from(serviceRequest)
      .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
      .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
      .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'service-request.findCreatedByIds', type: 'method' })
  async findCreatedByIds(ids: number[]) {
    return database
      .select(this.serviceRequestSelection)
      .from(serviceRequest)
      .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
      .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
      .where(and(inArray(serviceRequest.id, ids), isNull(serviceRequest.deletedAt)));
  }
}
