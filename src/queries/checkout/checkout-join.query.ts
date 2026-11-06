import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { checkout } from '@db/tables/checkout.table';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { promotionCodeRedemption } from '@db/tables/promotion-code-redemption.table';
import { promotionCode } from '@db/tables/promotion-code.table';
import { pyme } from '@db/tables/pyme.table';
import { serviceRequest } from '@db/tables/service-request.table';
import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';

@Injectable()
export class CheckoutJoinQuery {
  private readonly paymentHistoryMethodId = sql<string>`LOWER(COALESCE(
  ${checkout.rawPayment} ->> 'payment_method_id',
  ${checkout.rawPayment} -> 'payment_method' ->> 'id',
  ''
))`;

  private readonly paymentHistoryTypeId = sql<string>`LOWER(COALESCE(
  ${checkout.rawPayment} ->> 'payment_type_id',
  ${checkout.rawPayment} -> 'payment_method' ->> 'type',
  ''
))`;

  private readonly hasPromotionCodeRedemption = sql<boolean>`EXISTS (
  SELECT 1
  FROM ${promotionCodeRedemption}
  WHERE ${promotionCodeRedemption.checkoutId} = ${checkout.id}
    AND ${promotionCodeRedemption.deletedAt} IS NULL
)`;

  private readonly paymentHistorySelection = {
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
    paymentId: sql<string | null>`COALESCE(${checkout.rawPayment} -> 'monnet' ->> 'transactionId', ${checkout.rawPayment} -> 'monnet' ->> 'payinId', ${checkout.mercadoPagoPaymentId})`,
    paymentProvider: sql<'monnet' | 'mercado_pago' | null>`CASE WHEN ${checkout.rawPayment} ->> 'provider' = 'monnet' THEN 'monnet' WHEN ${checkout.mercadoPagoPaymentId} IS NOT NULL THEN 'mercado_pago' ELSE NULL END`,
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

  @TraceNode({ name: 'checkout.findAllForUser', type: 'method' })
  async findAllForUser(filters: { userId: number; role: 'pyme' | 'consultor'; page: number; limit: number; from?: Date; to?: Date; operationType?: 'servicio' | 'consultoria'; paymentType?: 'cupon' | 'mercado_pago' | 'tarjeta' | 'yape' | 'monnet' }) {
    const userCondition = filters.role === 'pyme' ? eq(checkout.pymeId, filters.userId) : eq(checkout.consultantId, filters.userId);
    const conditions = [isNull(checkout.deletedAt), eq(checkout.status, 'approved'), userCondition];
    if (filters.from) conditions.push(gte(checkout.createdAt, filters.from));
    if (filters.to) conditions.push(lt(checkout.createdAt, filters.to));
    if (filters.operationType === 'servicio') {
      conditions.push(isNotNull(checkout.serviceRequestId));
    } else if (filters.operationType === 'consultoria') {
      conditions.push(isNull(checkout.serviceRequestId));
    }
    if (filters.paymentType === 'cupon') {
      conditions.push(this.hasPromotionCodeRedemption);
    } else if (filters.paymentType) {
      conditions.push(sql`NOT (${this.hasPromotionCodeRedemption})`);
      if (filters.paymentType === 'monnet') {
        conditions.push(sql`${checkout.rawPayment} ->> 'provider' = 'monnet'`);
      } else if (filters.paymentType === 'mercado_pago') {
        conditions.push(sql`(${this.paymentHistoryMethodId} = 'account_money' OR ${this.paymentHistoryTypeId} = 'account_money')`);
      } else if (filters.paymentType === 'tarjeta') {
        conditions.push(sql`${this.paymentHistoryTypeId} IN ('credit_card', 'debit_card', 'prepaid_card')`);
      } else {
        conditions.push(sql`${this.paymentHistoryMethodId} = 'yape'`);
      }
    }
    const where = and(...conditions);
    const offset = (filters.page - 1) * filters.limit;
    const [data, totalResult] = await Promise.all([
      database
        .select(this.paymentHistorySelection)
        .from(checkout)
        .leftJoin(pyme, eq(checkout.pymeId, pyme.id))
        .leftJoin(consultant, eq(checkout.consultantId, consultant.id))
        .leftJoin(meeting, eq(checkout.meetingId, meeting.id))
        .leftJoin(serviceRequest, eq(checkout.serviceRequestId, serviceRequest.id))
        .leftJoin(promotionCodeRedemption, and(eq(promotionCodeRedemption.checkoutId, checkout.id), isNull(promotionCodeRedemption.deletedAt)))
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

  @TraceNode({ name: 'checkout.findOneForUser', type: 'method' })
  async findOneForUser(id: number, userId: number, role: 'pyme' | 'consultor') {
    const userCondition = role === 'pyme' ? eq(checkout.pymeId, userId) : eq(checkout.consultantId, userId);
    const result = await database
      .select(this.paymentHistorySelection)
      .from(checkout)
      .leftJoin(pyme, eq(checkout.pymeId, pyme.id))
      .leftJoin(consultant, eq(checkout.consultantId, consultant.id))
      .leftJoin(meeting, eq(checkout.meetingId, meeting.id))
      .leftJoin(serviceRequest, eq(checkout.serviceRequestId, serviceRequest.id))
      .leftJoin(promotionCodeRedemption, and(eq(promotionCodeRedemption.checkoutId, checkout.id), isNull(promotionCodeRedemption.deletedAt)))
      .leftJoin(promotionCode, eq(promotionCodeRedemption.promotionCodeId, promotionCode.id))
      .where(and(eq(checkout.id, id), eq(checkout.status, 'approved'), userCondition, isNull(checkout.deletedAt)));
    return result[0];
  }
}
