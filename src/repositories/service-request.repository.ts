import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import {
  serviceRequest,
  ServiceRequestDTO,
  ServiceRequestEvidenceAttachment,
  ServiceRequestMilestone,
  ServiceRequestPaymentPlan,
  serviceRequestStatusEnum,
} from '@db/tables/service-request.table';

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

const requestStatuses = ['requested', 'consultant_declined', 'cancelled'] as const;
const proposalStatuses = ['proposal_sent', 'payment_pending', 'paid', 'completed', 'pyme_declined'] as const;

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
          ilike(serviceRequest.subcategory, `%${search}%`),
          ilike(serviceRequest.expectedOutcome, `%${search}%`),
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
    return database.transaction(async (transaction) => {
      const inserted = await transaction.insert(serviceRequest).values(data).returning({ id: serviceRequest.id });
      const ids = inserted.map((item) => item.id);
      const created = await transaction
        .select(serviceRequestSelection)
        .from(serviceRequest)
        .leftJoin(pyme, eq(serviceRequest.pymeId, pyme.id))
        .leftJoin(consultant, eq(serviceRequest.consultantId, consultant.id))
        .where(and(inArray(serviceRequest.id, ids), isNull(serviceRequest.deletedAt)));
      const createdById = new Map(created.map((item) => [item.id, item]));
      return ids.map((id) => createdById.get(id)).filter((item) => item !== undefined);
    });
  }

  async insertMilestoneAt(
    id: number,
    insertAtIndex: number,
    milestoneToInsert: ServiceRequestMilestone,
    expectedMilestoneCount: number,
  ) {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          status: serviceRequest.status,
          milestones: serviceRequest.milestones,
          evidenceAttachments: serviceRequest.evidenceAttachments,
          paymentPlan: serviceRequest.paymentPlan,
        })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');

      if (
        !current ||
        current.status !== 'paid' ||
        current.milestones.length !== expectedMilestoneCount ||
        insertAtIndex < 1 ||
        insertAtIndex >= current.milestones.length
      ) {
        return false;
      }

      const milestones = [...current.milestones];
      milestones.splice(insertAtIndex, 0, milestoneToInsert);
      const evidenceAttachments = current.evidenceAttachments.map((attachment) =>
        attachment.milestoneIndex !== null && attachment.milestoneIndex >= insertAtIndex
          ? { ...attachment, milestoneIndex: attachment.milestoneIndex + 1 }
          : attachment,
      );
      const paymentPlan: ServiceRequestPaymentPlan = {
        ...current.paymentPlan,
        installments: current.paymentPlan.installments.map((installment) =>
          installment.milestoneIndex >= insertAtIndex
            ? { ...installment, milestoneIndex: installment.milestoneIndex + 1 }
            : installment,
        ),
      };
      const temporaryOffset = 1000;
      const activeServiceMeetings = and(
        eq(meeting.serviceRequestId, id),
        eq(meeting.meetingType, 'servicio'),
        isNull(meeting.deletedAt),
      );

      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} + ${temporaryOffset}`,
          updatedAt: new Date(),
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, insertAtIndex)));
      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} - ${temporaryOffset - 1}`,
          updatedAt: new Date(),
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, insertAtIndex + temporaryOffset)));

      await transaction
        .update(serviceRequest)
        .set({ milestones, evidenceAttachments, paymentPlan, updatedAt: new Date() })
        .where(eq(serviceRequest.id, id));
      return true;
    });
  }

  async rollbackInsertedMilestone(id: number, insertedIndex: number, insertedMilestone: ServiceRequestMilestone) {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          status: serviceRequest.status,
          milestones: serviceRequest.milestones,
          evidenceAttachments: serviceRequest.evidenceAttachments,
          paymentPlan: serviceRequest.paymentPlan,
        })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');
      const milestone = current?.milestones[insertedIndex];
      if (
        !current ||
        current.status !== 'paid' ||
        !milestone ||
        milestone.title !== insertedMilestone.title ||
        milestone.dueDate !== insertedMilestone.dueDate
      ) {
        return false;
      }

      const now = new Date();
      const activeServiceMeetings = and(
        eq(meeting.serviceRequestId, id),
        eq(meeting.meetingType, 'servicio'),
        isNull(meeting.deletedAt),
      );
      await transaction
        .update(meeting)
        .set({ deletedAt: now, updatedAt: now })
        .where(and(activeServiceMeetings, eq(meeting.serviceMilestoneIndex, insertedIndex)));

      const temporaryOffset = 1000;
      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} + ${temporaryOffset}`,
          updatedAt: now,
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, insertedIndex + 1)));
      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} - ${temporaryOffset + 1}`,
          updatedAt: now,
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, insertedIndex + 1 + temporaryOffset)));

      const milestones = [...current.milestones];
      milestones.splice(insertedIndex, 1);
      const evidenceAttachments: ServiceRequestEvidenceAttachment[] = current.evidenceAttachments.map((attachment) => {
        if (attachment.milestoneIndex === insertedIndex) {
          return { ...attachment, milestoneIndex: null };
        }
        if (attachment.milestoneIndex !== null && attachment.milestoneIndex > insertedIndex) {
          return { ...attachment, milestoneIndex: attachment.milestoneIndex - 1 };
        }
        return attachment;
      });
      const paymentPlan: ServiceRequestPaymentPlan = {
        ...current.paymentPlan,
        installments: current.paymentPlan.installments.map((installment) =>
          installment.milestoneIndex > insertedIndex
            ? { ...installment, milestoneIndex: installment.milestoneIndex - 1 }
            : installment,
        ),
      };
      await transaction
        .update(serviceRequest)
        .set({ milestones, evidenceAttachments, paymentPlan, updatedAt: now })
        .where(eq(serviceRequest.id, id));
      return true;
    });
  }

  async updateMilestone(
    id: number,
    milestoneIndex: number,
    milestoneToUpdate: ServiceRequestMilestone,
    expectedMilestoneCount: number,
  ) {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ status: serviceRequest.status, milestones: serviceRequest.milestones })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');

      if (
        !current ||
        current.status !== 'paid' ||
        current.milestones.length !== expectedMilestoneCount ||
        milestoneIndex < 1 ||
        milestoneIndex >= current.milestones.length - 1
      ) {
        return false;
      }

      const [existingMeeting] = await transaction
        .select({ id: meeting.id })
        .from(meeting)
        .where(
          and(
            eq(meeting.serviceRequestId, id),
            eq(meeting.meetingType, 'servicio'),
            eq(meeting.serviceMilestoneIndex, milestoneIndex),
            isNull(meeting.deletedAt),
          ),
        )
        .limit(1);
      if (existingMeeting) return false;

      const milestones = [...current.milestones];
      milestones[milestoneIndex] = milestoneToUpdate;
      await transaction
        .update(serviceRequest)
        .set({ milestones, updatedAt: new Date() })
        .where(eq(serviceRequest.id, id));
      return true;
    });
  }

  async removeMilestoneAt(id: number, milestoneIndex: number, expectedMilestoneCount: number) {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({
          status: serviceRequest.status,
          milestones: serviceRequest.milestones,
          evidenceAttachments: serviceRequest.evidenceAttachments,
          paymentPlan: serviceRequest.paymentPlan,
        })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');

      if (
        !current ||
        current.status !== 'paid' ||
        current.milestones.length !== expectedMilestoneCount ||
        milestoneIndex < 1 ||
        milestoneIndex >= current.milestones.length - 1 ||
        current.paymentPlan.installments.some((installment) => installment.milestoneIndex === milestoneIndex) ||
        current.evidenceAttachments.some((attachment) => attachment.milestoneIndex === milestoneIndex)
      ) {
        return false;
      }

      const [existingMeeting] = await transaction
        .select({ id: meeting.id })
        .from(meeting)
        .where(
          and(
            eq(meeting.serviceRequestId, id),
            eq(meeting.meetingType, 'servicio'),
            eq(meeting.serviceMilestoneIndex, milestoneIndex),
            isNull(meeting.deletedAt),
          ),
        )
        .limit(1);
      if (existingMeeting) return false;

      const temporaryOffset = 1000;
      const activeServiceMeetings = and(
        eq(meeting.serviceRequestId, id),
        eq(meeting.meetingType, 'servicio'),
        isNull(meeting.deletedAt),
      );
      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} + ${temporaryOffset}`,
          updatedAt: new Date(),
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, milestoneIndex + 1)));
      await transaction
        .update(meeting)
        .set({
          serviceMilestoneIndex: sql<number>`${meeting.serviceMilestoneIndex} - ${temporaryOffset + 1}`,
          updatedAt: new Date(),
        })
        .where(and(activeServiceMeetings, gte(meeting.serviceMilestoneIndex, milestoneIndex + 1 + temporaryOffset)));

      const milestones = [...current.milestones];
      milestones.splice(milestoneIndex, 1);
      const evidenceAttachments = current.evidenceAttachments.map((attachment) =>
        attachment.milestoneIndex !== null && attachment.milestoneIndex > milestoneIndex
          ? { ...attachment, milestoneIndex: attachment.milestoneIndex - 1 }
          : attachment,
      );
      const paymentPlan: ServiceRequestPaymentPlan = {
        ...current.paymentPlan,
        installments: current.paymentPlan.installments.map((installment) =>
          installment.milestoneIndex > milestoneIndex
            ? { ...installment, milestoneIndex: installment.milestoneIndex - 1 }
            : installment,
        ),
      };
      await transaction
        .update(serviceRequest)
        .set({ milestones, evidenceAttachments, paymentPlan, updatedAt: new Date() })
        .where(eq(serviceRequest.id, id));
      return true;
    });
  }

  async removeEvidenceAttachment(id: number, attachmentId: string) {
    return database.transaction(async (transaction) => {
      const [current] = await transaction
        .select({ status: serviceRequest.status, evidenceAttachments: serviceRequest.evidenceAttachments })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');
      if (!current || current.status !== 'paid') return undefined;

      const attachment = current.evidenceAttachments.find((item) => item.id === attachmentId);
      if (!attachment) return undefined;
      const evidenceAttachments = current.evidenceAttachments.filter((item) => item.id !== attachmentId);
      await transaction
        .update(serviceRequest)
        .set({ evidenceAttachments, updatedAt: new Date() })
        .where(eq(serviceRequest.id, id));
      return attachment;
    });
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
