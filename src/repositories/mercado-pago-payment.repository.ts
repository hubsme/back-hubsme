import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, lt, ne, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { mercadoPagoPayment, MercadoPagoPaymentDTO } from '@db/tables/mercado-pago-payment.table';
import { consultant } from '@db/tables/consultant.table';
import { pyme } from '@db/tables/pyme.table';

type PaymentHistoryRole = 'pyme' | 'consultor';

export type MercadoPagoPaymentHistoryFilters = {
  userId: number;
  role: PaymentHistoryRole;
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
};

const paymentHistorySelection = {
  id: mercadoPagoPayment.id,
  createdAt: mercadoPagoPayment.createdAt,
  updatedAt: mercadoPagoPayment.updatedAt,
  meetingId: mercadoPagoPayment.meetingId,
  pymeId: mercadoPagoPayment.pymeId,
  consultantId: mercadoPagoPayment.consultantId,
  mercadoPagoPaymentId: mercadoPagoPayment.mercadoPagoPaymentId,
  externalReference: mercadoPagoPayment.externalReference,
  status: mercadoPagoPayment.status,
  amount: mercadoPagoPayment.amount,
  marketplaceFee: mercadoPagoPayment.marketplaceFee,
  currency: mercadoPagoPayment.currency,
  meetingDetails: mercadoPagoPayment.meetingDetails,
  pymeName: pyme.name,
  consultantName: consultant.fullName,
};

@Injectable()
export class MercadoPagoPaymentRepository {
  async findOne(id: number) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.id, id), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByMeetingId(meetingId: number) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.meetingId, meetingId), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByExternalReference(externalReference: string) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.externalReference, externalReference), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByPreferenceId(preferenceId: string) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.preferenceId, preferenceId), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findAllForUser(filters: MercadoPagoPaymentHistoryFilters) {
    const userCondition =
      filters.role === 'pyme'
        ? eq(mercadoPagoPayment.pymeId, filters.userId)
        : eq(mercadoPagoPayment.consultantId, filters.userId);
    const conditions = [isNull(mercadoPagoPayment.deletedAt), userCondition];

    if (filters.from) conditions.push(gte(mercadoPagoPayment.createdAt, filters.from));
    if (filters.to) conditions.push(lt(mercadoPagoPayment.createdAt, filters.to));

    const where = and(...conditions);
    const offset = (filters.page - 1) * filters.limit;

    const [data, totalResult] = await Promise.all([
      database
        .select(paymentHistorySelection)
        .from(mercadoPagoPayment)
        .leftJoin(pyme, eq(mercadoPagoPayment.pymeId, pyme.id))
        .leftJoin(consultant, eq(mercadoPagoPayment.consultantId, consultant.id))
        .where(where)
        .orderBy(desc(mercadoPagoPayment.createdAt), desc(mercadoPagoPayment.id))
        .limit(filters.limit)
        .offset(offset),
      database
        .select({ count: sql<number>`count(*)` })
        .from(mercadoPagoPayment)
        .where(where),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async findOneForUser(id: number, userId: number, role: PaymentHistoryRole) {
    const userCondition =
      role === 'pyme' ? eq(mercadoPagoPayment.pymeId, userId) : eq(mercadoPagoPayment.consultantId, userId);

    const result = await database
      .select(paymentHistorySelection)
      .from(mercadoPagoPayment)
      .leftJoin(pyme, eq(mercadoPagoPayment.pymeId, pyme.id))
      .leftJoin(consultant, eq(mercadoPagoPayment.consultantId, consultant.id))
      .where(and(eq(mercadoPagoPayment.id, id), userCondition, isNull(mercadoPagoPayment.deletedAt)));

    return result[0];
  }

  async create(data: MercadoPagoPaymentDTO) {
    const result = await database.insert(mercadoPagoPayment).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<MercadoPagoPaymentDTO>) {
    const result = await database
      .update(mercadoPagoPayment)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(mercadoPagoPayment.id, id), isNull(mercadoPagoPayment.deletedAt)))
      .returning();
    return result[0];
  }

  async approveIfUnprocessed(id: number, data: Partial<MercadoPagoPaymentDTO>) {
    const result = await database
      .update(mercadoPagoPayment)
      .set({ ...data, status: 'approved', updatedAt: new Date() })
      .where(
        and(
          eq(mercadoPagoPayment.id, id),
          ne(mercadoPagoPayment.status, 'approved'),
          isNull(mercadoPagoPayment.deletedAt),
        ),
      )
      .returning();
    return result[0];
  }
}
