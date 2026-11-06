import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { checkout } from '@db/tables/checkout.table';
import { consultant } from '@db/tables/consultant.table';
import { meetingConsultantPayout } from '@db/tables/meeting-consultant-payout.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';

@Injectable()
export class MeetingConsultantPayoutJoinQuery {
  private readonly payoutSelection = {
    id: meetingConsultantPayout.id,
    createdAt: meetingConsultantPayout.createdAt,
    updatedAt: meetingConsultantPayout.updatedAt,
    meetingId: meetingConsultantPayout.meetingId,
    checkoutId: meetingConsultantPayout.checkoutId,
    pymeId: meetingConsultantPayout.pymeId,
    consultantId: meetingConsultantPayout.consultantId,
    amount: meetingConsultantPayout.amount,
    mercadoPagoFeeAmount: meetingConsultantPayout.mercadoPagoFeeAmount,
    mercadoPagoFeePercent: meetingConsultantPayout.mercadoPagoFeePercent,
    currency: meetingConsultantPayout.currency,
    status: meetingConsultantPayout.status,
    paymentReference: meetingConsultantPayout.paymentReference,
    evidenceFileUrl: meetingConsultantPayout.evidenceFileUrl,
    evidenceStoragePath: meetingConsultantPayout.evidenceStoragePath,
    evidenceOriginalName: meetingConsultantPayout.evidenceOriginalName,
    evidenceMimeType: meetingConsultantPayout.evidenceMimeType,
    evidenceSizeBytes: meetingConsultantPayout.evidenceSizeBytes,
    notes: meetingConsultantPayout.notes,
    paidAt: meetingConsultantPayout.paidAt,
    processedByAdmin: meetingConsultantPayout.processedByAdmin,
    meetingTitle: meeting.title,
    meetingStartTime: meeting.startTime,
    meetingStatus: meeting.status,
    pymeName: sql<string>`COALESCE(${pyme.name}, 'PYME')`,
    consultantName: sql<string>`COALESCE(${consultant.fullName}, 'Consultor')`,
    mercadoPagoPaymentId: checkout.mercadoPagoPaymentId,
    checkoutExternalReference: checkout.externalReference,
    grossAmount: checkout.amount,
    platformCommissionAmount: checkout.marketplaceFee,
    meetingDurationMinutes: meeting.durationMinutes,
    meetingUrl: meeting.meetingUrl,
    meetingCompletedAt: meeting.completedAt,
    meetingCancellationReason: meeting.cancellationReason,
    rescheduleCount: sql<number>`COALESCE((
    SELECT COUNT(*)::int
    FROM meeting_reschedule_history AS mrh
    WHERE mrh.root_meeting_id = ${meetingConsultantPayout.meetingId}
      AND mrh.deleted_at IS NULL
  ), 0)`,
    latestMeetingId: sql<number>`COALESCE(
    (
      SELECT mrh.replacement_meeting_id
      FROM meeting_reschedule_history AS mrh
      WHERE mrh.root_meeting_id = ${meetingConsultantPayout.meetingId}
        AND mrh.replacement_meeting_id IS NOT NULL
        AND mrh.deleted_at IS NULL
      ORDER BY mrh.created_at DESC, mrh.id DESC
      LIMIT 1
    ),
    ${meetingConsultantPayout.meetingId}
  )`,
    latestMeetingTitle: sql<string>`COALESCE(
    (
      SELECT lm.title
      FROM meeting_reschedule_history AS mrh
      JOIN meeting AS lm ON lm.id = mrh.replacement_meeting_id
      WHERE mrh.root_meeting_id = ${meetingConsultantPayout.meetingId}
        AND mrh.replacement_meeting_id IS NOT NULL
        AND mrh.deleted_at IS NULL
      ORDER BY mrh.created_at DESC, mrh.id DESC
      LIMIT 1
    ),
    ${meeting.title}
  )`,
    latestMeetingStartTime: sql<Date | null>`COALESCE(
    (
      SELECT lm.start_time
      FROM meeting_reschedule_history AS mrh
      JOIN meeting AS lm ON lm.id = mrh.replacement_meeting_id
      WHERE mrh.root_meeting_id = ${meetingConsultantPayout.meetingId}
        AND mrh.replacement_meeting_id IS NOT NULL
        AND mrh.deleted_at IS NULL
      ORDER BY mrh.created_at DESC, mrh.id DESC
      LIMIT 1
    ),
    ${meeting.startTime}
  )`,
    latestMeetingStatus: sql<'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada'>`COALESCE(
    (
      SELECT lm.status
      FROM meeting_reschedule_history AS mrh
      JOIN meeting AS lm ON lm.id = mrh.replacement_meeting_id
      WHERE mrh.root_meeting_id = ${meetingConsultantPayout.meetingId}
        AND mrh.replacement_meeting_id IS NOT NULL
        AND mrh.deleted_at IS NULL
      ORDER BY mrh.created_at DESC, mrh.id DESC
      LIMIT 1
    ),
    ${meeting.status}
  )`,
  };

  @TraceNode({ name: 'meeting-consultant-payout.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.id, id)).limit(1);
    return result[0];
  }

  @TraceNode({ name: 'meeting-consultant-payout.findByCheckoutId', type: 'method' })
  async findByCheckoutId(checkoutId: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.checkoutId, checkoutId)).limit(1);
    return result[0];
  }

  @TraceNode({ name: 'meeting-consultant-payout.findByMeetingId', type: 'method' })
  async findByMeetingId(meetingId: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.meetingId, meetingId)).limit(1);
    return result[0];
  }

  @TraceNode({ name: 'meeting-consultant-payout.findAllPaginated', type: 'method' })
  async findAllPaginated(filters: {
    page: number;
    limit: number;
    search?: string;
    consultantId?: number;
    status?: 'pending' | 'paid';
  }) {
    const conditions = [];
    const normalizedSearch = filters.search?.trim();
    if (normalizedSearch) {
      const search = `%${normalizedSearch}%`;
      conditions.push(
        or(
          ilike(meeting.title, search),
          ilike(pyme.name, search),
          ilike(consultant.fullName, search),
          ilike(meetingConsultantPayout.paymentReference, search),
          ilike(checkout.mercadoPagoPaymentId, search),
        ),
      );
    }
    if (filters.consultantId) {
      conditions.push(eq(meetingConsultantPayout.consultantId, filters.consultantId));
    }
    if (filters.status) {
      conditions.push(eq(meetingConsultantPayout.status, filters.status));
    }
    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (filters.page - 1) * filters.limit;
    const [data, totalResult] = await Promise.all([
      this.baseQuery()
        .where(where)
        .orderBy(
          asc(sql`CASE WHEN ${meetingConsultantPayout.status} = 'pending' THEN 0 ELSE 1 END`),
          desc(meetingConsultantPayout.createdAt),
          desc(meetingConsultantPayout.id),
        )
        .limit(filters.limit)
        .offset(offset),
      database
        .select({ total: count() })
        .from(meetingConsultantPayout)
        .leftJoin(meeting, eq(meeting.id, meetingConsultantPayout.meetingId))
        .leftJoin(pyme, eq(pyme.id, meetingConsultantPayout.pymeId))
        .leftJoin(consultant, eq(consultant.id, meetingConsultantPayout.consultantId))
        .leftJoin(checkout, eq(checkout.id, meetingConsultantPayout.checkoutId))
        .where(where),
    ]);
    return { data, total: Number(totalResult[0]?.total ?? 0) };
  }

  @TraceNode({ name: 'meeting-consultant-payout.baseQuery', type: 'method' })
  private baseQuery() {
    return database
      .select(this.payoutSelection)
      .from(meetingConsultantPayout)
      .leftJoin(meeting, eq(meeting.id, meetingConsultantPayout.meetingId))
      .leftJoin(pyme, eq(pyme.id, meetingConsultantPayout.pymeId))
      .leftJoin(consultant, eq(consultant.id, meetingConsultantPayout.consultantId))
      .leftJoin(checkout, eq(checkout.id, meetingConsultantPayout.checkoutId));
  }
}
