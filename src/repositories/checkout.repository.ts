import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { checkout, CheckoutDTO } from '@db/tables/checkout.table';
import { promotionCode, promotionCodeRedemption } from '@db/tables/promotion-code.table';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { serviceRequest } from '@db/tables/service-request.table';

type PaymentHistoryRole = 'pyme' | 'consultor';

export type CheckoutHistoryFilters = {
  userId: number;
  role: PaymentHistoryRole;
  page: number;
  limit: number;
  from?: Date;
  to?: Date;
  operationType?: 'servicio' | 'consultoria';
  paymentType?: 'cupon' | 'mercado_pago' | 'tarjeta' | 'yape';
};

const paymentHistoryMethodId = sql<string>`LOWER(COALESCE(
  ${checkout.rawPayment} ->> 'payment_method_id',
  ${checkout.rawPayment} -> 'payment_method' ->> 'id',
  ''
))`;

const paymentHistoryTypeId = sql<string>`LOWER(COALESCE(
  ${checkout.rawPayment} ->> 'payment_type_id',
  ${checkout.rawPayment} -> 'payment_method' ->> 'type',
  ''
))`;

const hasPromotionCodeRedemption = sql<boolean>`EXISTS (
  SELECT 1
  FROM ${promotionCodeRedemption}
  WHERE ${promotionCodeRedemption.checkoutId} = ${checkout.id}
    AND ${promotionCodeRedemption.deletedAt} IS NULL
)`;

const paymentHistorySelection = {
  id: checkout.id,
  createdAt: checkout.createdAt,
  updatedAt: checkout.updatedAt,
  meetingCreatedAt: sql<Date | null>`COALESCE(
    ${meeting.createdAt},
    (
      SELECT service_meeting.created_at
      FROM meeting AS service_meeting
      WHERE service_meeting.service_request_id = ${checkout.serviceRequestId}
        AND service_meeting.deleted_at IS NULL
      ORDER BY service_meeting.service_milestone_index ASC NULLS LAST, service_meeting.id ASC
      LIMIT 1
    )
  )`,
  meetingStartTime: sql<Date | null>`COALESCE(
    ${meeting.startTime},
    NULLIF(${meeting.proposedStartTimes}[1], '')::timestamp,
    (
      SELECT COALESCE(
        service_meeting.start_time,
        NULLIF(service_meeting.proposed_start_times[1], '')::timestamp
      )
      FROM meeting AS service_meeting
      WHERE service_meeting.service_request_id = ${checkout.serviceRequestId}
        AND service_meeting.deleted_at IS NULL
      ORDER BY service_meeting.service_milestone_index ASC NULLS LAST, service_meeting.id ASC
      LIMIT 1
    )
  )`,
  meetingId: checkout.meetingId,
  serviceRequestId: checkout.serviceRequestId,
  serviceInstallmentIndex: checkout.serviceInstallmentIndex,
  pymeId: checkout.pymeId,
  consultantId: checkout.consultantId,
  mercadoPagoPaymentId: checkout.mercadoPagoPaymentId,
  externalReference: checkout.externalReference,
  status: checkout.status,
  amount: checkout.amount,
  marketplaceFee: checkout.marketplaceFee,
  currency: checkout.currency,
  meetingDetails: checkout.meetingDetails,
  meetingStatus: meeting.status,
  meetingCancellationReason: meeting.cancellationReason,
  serviceTitle: serviceRequest.title,
  serviceDescription: serviceRequest.description,
  pymeName: pyme.name,
  consultantName: consultant.fullName,
  paymentMethod: sql<'payment' | 'promotion_code'>`
    CASE
      WHEN ${promotionCodeRedemption.id} IS NOT NULL THEN 'promotion_code'
      ELSE 'payment'
    END
  `,
  paymentMethodId: sql<string | null>`
    COALESCE(
      ${checkout.rawPayment} ->> 'payment_method_id',
      ${checkout.rawPayment} -> 'payment_method' ->> 'id'
    )
  `,
  paymentTypeId: sql<string | null>`
    COALESCE(
      ${checkout.rawPayment} ->> 'payment_type_id',
      ${checkout.rawPayment} -> 'payment_method' ->> 'type'
    )
  `,
  promotionCode: promotionCode.code,
};

@Injectable()
export class CheckoutRepository {
  async findOne(id: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)));
    return result[0];
  }

  async findByMeetingId(meetingId: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.meetingId, meetingId), isNull(checkout.deletedAt)));
    return result[0];
  }

  async findByServiceRequestId(serviceRequestId: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.serviceRequestId, serviceRequestId), isNull(checkout.deletedAt)))
      .orderBy(desc(checkout.serviceInstallmentIndex), desc(checkout.id));
    return result[0];
  }

  async findByServiceRequestInstallment(serviceRequestId: number, serviceInstallmentIndex: number) {
    const result = await database
      .select()
      .from(checkout)
      .where(
        and(
          eq(checkout.serviceRequestId, serviceRequestId),
          eq(checkout.serviceInstallmentIndex, serviceInstallmentIndex),
          isNull(checkout.deletedAt),
        ),
      );
    return result[0];
  }

  async findAllByServiceRequestId(serviceRequestId: number) {
    return database
      .select()
      .from(checkout)
      .where(and(eq(checkout.serviceRequestId, serviceRequestId), isNull(checkout.deletedAt)))
      .orderBy(checkout.serviceInstallmentIndex, checkout.id);
  }

  async findByExternalReference(externalReference: string) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.externalReference, externalReference), isNull(checkout.deletedAt)));
    return result[0];
  }

  async findByPreferenceId(preferenceId: string) {
    const result = await database
      .select()
      .from(checkout)
      .where(and(eq(checkout.preferenceId, preferenceId), isNull(checkout.deletedAt)));
    return result[0];
  }

  async findAllForUser(filters: CheckoutHistoryFilters) {
    const userCondition =
      filters.role === 'pyme' ? eq(checkout.pymeId, filters.userId) : eq(checkout.consultantId, filters.userId);
    const conditions = [isNull(checkout.deletedAt), eq(checkout.status, 'approved'), userCondition];

    if (filters.from) conditions.push(gte(checkout.createdAt, filters.from));
    if (filters.to) conditions.push(lt(checkout.createdAt, filters.to));
    if (filters.operationType === 'servicio') {
      conditions.push(isNotNull(checkout.serviceRequestId));
    } else if (filters.operationType === 'consultoria') {
      conditions.push(isNull(checkout.serviceRequestId));
    }

    if (filters.paymentType === 'cupon') {
      conditions.push(hasPromotionCodeRedemption);
    } else if (filters.paymentType) {
      conditions.push(sql`NOT (${hasPromotionCodeRedemption})`);
      if (filters.paymentType === 'mercado_pago') {
        conditions.push(sql`(${paymentHistoryMethodId} = 'account_money' OR ${paymentHistoryTypeId} = 'account_money')`);
      } else if (filters.paymentType === 'tarjeta') {
        conditions.push(sql`${paymentHistoryTypeId} IN ('credit_card', 'debit_card', 'prepaid_card')`);
      } else {
        conditions.push(sql`${paymentHistoryMethodId} = 'yape'`);
      }
    }

    const where = and(...conditions);
    const offset = (filters.page - 1) * filters.limit;

    const [data, totalResult] = await Promise.all([
      database
        .select(paymentHistorySelection)
        .from(checkout)
        .leftJoin(pyme, eq(checkout.pymeId, pyme.id))
        .leftJoin(consultant, eq(checkout.consultantId, consultant.id))
        .leftJoin(meeting, eq(checkout.meetingId, meeting.id))
        .leftJoin(serviceRequest, eq(checkout.serviceRequestId, serviceRequest.id))
        .leftJoin(
          promotionCodeRedemption,
          and(eq(promotionCodeRedemption.checkoutId, checkout.id), isNull(promotionCodeRedemption.deletedAt)),
        )
        .leftJoin(promotionCode, eq(promotionCodeRedemption.promotionCodeId, promotionCode.id))
        .where(where)
        .orderBy(desc(checkout.createdAt), desc(checkout.id))
        .limit(filters.limit)
        .offset(offset),
      database
        .select({ count: sql<number>`count(*)` })
        .from(checkout)
        .where(where),
    ]);

    return {
      data,
      total: Number(totalResult[0]?.count ?? 0),
    };
  }

  async findOneForUser(id: number, userId: number, role: PaymentHistoryRole) {
    const userCondition = role === 'pyme' ? eq(checkout.pymeId, userId) : eq(checkout.consultantId, userId);

    const result = await database
      .select(paymentHistorySelection)
      .from(checkout)
      .leftJoin(pyme, eq(checkout.pymeId, pyme.id))
      .leftJoin(consultant, eq(checkout.consultantId, consultant.id))
      .leftJoin(meeting, eq(checkout.meetingId, meeting.id))
      .leftJoin(serviceRequest, eq(checkout.serviceRequestId, serviceRequest.id))
      .leftJoin(
        promotionCodeRedemption,
        and(eq(promotionCodeRedemption.checkoutId, checkout.id), isNull(promotionCodeRedemption.deletedAt)),
      )
      .leftJoin(promotionCode, eq(promotionCodeRedemption.promotionCodeId, promotionCode.id))
      .where(and(eq(checkout.id, id), eq(checkout.status, 'approved'), userCondition, isNull(checkout.deletedAt)));

    return result[0];
  }

  async create(data: CheckoutDTO) {
    const result = await database.insert(checkout).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<CheckoutDTO>) {
    const result = await database
      .update(checkout)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(checkout.id, id), isNull(checkout.deletedAt)))
      .returning();
    return result[0];
  }

  async approveIfUnprocessed(id: number, data: Partial<CheckoutDTO>) {
    const result = await database
      .update(checkout)
      .set({ ...data, status: 'approved', updatedAt: new Date() })
      .where(and(eq(checkout.id, id), ne(checkout.status, 'approved'), isNull(checkout.deletedAt)))
      .returning();
    return result[0];
  }
}
