import { database, transaction } from '@db/connection.db';
import { serviceRequest, serviceRequestStatusEnum } from '@db/tables/service-request.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull } from 'drizzle-orm';

@Injectable()
export class ServiceRequestQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'service-request.removeEvidenceAttachment', type: 'method' })
  async removeEvidenceAttachment(id: number, attachmentId: string) {
    return this.transaction(async () => {
      const [current] = await database
        .select({ status: serviceRequest.status, evidenceAttachments: serviceRequest.evidenceAttachments })
        .from(serviceRequest)
        .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
        .for('update');
      if (!current || current.status !== 'paid') return undefined;
      const attachment = current.evidenceAttachments.find((item) => item.id === attachmentId);
      if (!attachment) return undefined;
      const evidenceAttachments = current.evidenceAttachments.filter((item) => item.id !== attachmentId);
      await database
        .update(serviceRequest)
        .set({ evidenceAttachments, updatedAt: new Date() })
        .where(eq(serviceRequest.id, id));
      return attachment;
    });
  }

  @TraceNode({ name: 'service-request.update', type: 'method' })
  async update(
    id: number,
    data: Partial<typeof serviceRequest.$inferInsert>,
    expectedStatuses?: Array<(typeof serviceRequestStatusEnum.enumValues)[number]>,
  ) {
    const conditions = [eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)];
    if (expectedStatuses?.length) conditions.push(inArray(serviceRequest.status, expectedStatuses));
    const result = await database
      .update(serviceRequest)
      .set({ ...data, updatedAt: new Date() })
      .where(and(...conditions))
      .returning({ id: serviceRequest.id });
    return result[0];
  }

  @TraceNode({ name: 'service-request.createMany', type: 'method' })
  async createMany(data: (typeof serviceRequest.$inferInsert)[]) {
    return database.insert(serviceRequest).values(data).returning({ id: serviceRequest.id });
  }
  @TraceNode({ name: 'service-request.lockMilestoneState', type: 'method' })
  async lockMilestoneState(id: number) {
    return database
      .select({
        status: serviceRequest.status,
        milestones: serviceRequest.milestones,
        evidenceAttachments: serviceRequest.evidenceAttachments,
        paymentPlan: serviceRequest.paymentPlan,
      })
      .from(serviceRequest)
      .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
      .for('update');
  }
  @TraceNode({ name: 'service-request.lockMilestoneDefinition', type: 'method' })
  async lockMilestoneDefinition(id: number) {
    return database
      .select({ status: serviceRequest.status, milestones: serviceRequest.milestones })
      .from(serviceRequest)
      .where(and(eq(serviceRequest.id, id), isNull(serviceRequest.deletedAt)))
      .for('update');
  }
  @TraceNode({ name: 'service-request.updateMilestoneState', type: 'method' })
  async updateMilestoneState(
    id: number,
    data: {
      milestones: (typeof serviceRequest.$inferSelect)['milestones'];
      evidenceAttachments?: (typeof serviceRequest.$inferSelect)['evidenceAttachments'];
      paymentPlan?: (typeof serviceRequest.$inferSelect)['paymentPlan'];
    },
    now: Date,
  ) {
    await database
      .update(serviceRequest)
      .set({ ...data, updatedAt: now })
      .where(eq(serviceRequest.id, id));
  }
}
