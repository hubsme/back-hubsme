import { database, transaction } from '@db/connection.db';
import { checkout } from '@db/tables/checkout.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, ne } from 'drizzle-orm';

@Injectable()
export class CheckoutQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'checkout.lock', type: 'method' })
  async lock(id: number) {
    const [row] = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)))
      .limit(1)
      .for('update');
    return row;
  }

  @TraceNode({ name: 'checkout.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'checkout.findByMeetingId', type: 'method' })
  async findByMeetingId(meetingId: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.meetingId, meetingId), isNull(checkout.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'checkout.findByServiceRequestId', type: 'method' })
  async findByServiceRequestId(serviceRequestId: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.serviceRequestId, serviceRequestId), isNull(checkout.deletedAt)))
      .orderBy(desc(checkout.serviceInstallmentIndex), desc(checkout.id));
    return result[0];
  }

  @TraceNode({ name: 'checkout.findByServiceRequestInstallment', type: 'method' })
  async findByServiceRequestInstallment(serviceRequestId: number, serviceInstallmentIndex: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.serviceRequestId, serviceRequestId), eq(checkout.serviceInstallmentIndex, serviceInstallmentIndex), isNull(checkout.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'checkout.findAllByServiceRequestId', type: 'method' })
  async findAllByServiceRequestId(serviceRequestId: number) {
    return database
      .select()
      .from(checkout)
      .where(and(eq(checkout.serviceRequestId, serviceRequestId), isNull(checkout.deletedAt)))
      .orderBy(checkout.serviceInstallmentIndex, checkout.id);
  }

  @TraceNode({ name: 'checkout.findByExternalReference', type: 'method' })
  async findByExternalReference(externalReference: string) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.externalReference, externalReference), isNull(checkout.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'checkout.findByPreferenceId', type: 'method' })
  async findByPreferenceId(preferenceId: string) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.preferenceId, preferenceId), isNull(checkout.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'checkout.create', type: 'method' })
  async create(data: typeof checkout.$inferInsert) {
    const result = await database.insert(checkout).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'checkout.update', type: 'method' })
  async update(id: number, data: Partial<typeof checkout.$inferInsert>) {
    const result = await database
      .update(checkout)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'checkout.approveIfUnprocessed', type: 'method' })
  async approveIfUnprocessed(id: number, data: Partial<typeof checkout.$inferInsert>) {
    const result = await database
      .update(checkout)
      .set({ ...data, status: 'approved', updatedAt: new Date() })
      .where(and(eq(checkout.id, id), ne(checkout.status, 'approved'), isNull(checkout.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'checkout.approveWithPromotionCode', type: 'method' })
  async approveWithPromotionCode(id: number, meetingId: number, rawPayment: Record<string, unknown>) {
    await database
      .update(checkout)
      .set({ meetingId, status: 'approved', marketplaceFee: '0.00', rawPayment, updatedAt: new Date() })
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)));
  }
  @TraceNode({ name: 'checkout.approveServiceWithPromotionCode', type: 'method' })
  async approveServiceWithPromotionCode(id: number, rawPayment: Record<string, unknown>) {
    return database
      .update(checkout)
      .set({ status: 'approved', marketplaceFee: '0.00', rawPayment, updatedAt: new Date() })
      .where(and(eq(checkout.id, id), ne(checkout.status, 'approved'), isNull(checkout.deletedAt)))
      .returning();
  }
}
