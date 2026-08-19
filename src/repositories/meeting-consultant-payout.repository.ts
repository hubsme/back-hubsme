import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meetingConsultantPayout, MeetingConsultantPayoutDTO } from '@db/tables/meeting-consultant-payout.table';
import { checkout } from '@db/tables/checkout.table';
import { consultant } from '@db/tables/consultant.table';
import { meeting } from '@db/tables/meeting.table';
import { pyme } from '@db/tables/pyme.table';

export type MeetingConsultantPayoutFilters = {
  page: number;
  limit: number;
  search?: string;
  consultantId?: number;
  status?: 'pending' | 'paid';
};

const payoutSelection = {
  id: meetingConsultantPayout.id,
  createdAt: meetingConsultantPayout.createdAt,
  updatedAt: meetingConsultantPayout.updatedAt,
  meetingId: meetingConsultantPayout.meetingId,
  checkoutId: meetingConsultantPayout.checkoutId,
  pymeId: meetingConsultantPayout.pymeId,
  consultantId: meetingConsultantPayout.consultantId,
  amount: meetingConsultantPayout.amount,
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

@Injectable()
export class MeetingConsultantPayoutRepository {
  async createPending(data: MeetingConsultantPayoutDTO) {
    const inserted = await database
      .insert(meetingConsultantPayout)
      .values(data)
      .onConflictDoNothing()
      .returning({ id: meetingConsultantPayout.id });

    if (inserted[0]) {
      return this.findOne(inserted[0].id);
    }

    return (await this.findByCheckoutId(data.checkoutId)) ?? this.findByMeetingId(data.meetingId);
  }

  async findOne(id: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.id, id)).limit(1);
    return result[0];
  }

  async findByCheckoutId(checkoutId: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.checkoutId, checkoutId)).limit(1);
    return result[0];
  }

  async findByMeetingId(meetingId: number) {
    const result = await this.baseQuery().where(eq(meetingConsultantPayout.meetingId, meetingId)).limit(1);
    return result[0];
  }

  async findAllPaginated(filters: MeetingConsultantPayoutFilters) {
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

  async markPaid(
    id: number,
    data: Pick<
      MeetingConsultantPayoutDTO,
      | 'paymentReference'
      | 'evidenceFileUrl'
      | 'evidenceStoragePath'
      | 'evidenceOriginalName'
      | 'evidenceMimeType'
      | 'evidenceSizeBytes'
      | 'notes'
      | 'paidAt'
      | 'processedByAdmin'
    >,
  ) {
    const updated = await database
      .update(meetingConsultantPayout)
      .set({ ...data, status: 'paid', updatedAt: new Date() })
      .where(and(eq(meetingConsultantPayout.id, id), eq(meetingConsultantPayout.status, 'pending')))
      .returning({ id: meetingConsultantPayout.id });

    return updated[0] ? this.findOne(updated[0].id) : undefined;
  }

  private baseQuery() {
    return database
      .select(payoutSelection)
      .from(meetingConsultantPayout)
      .leftJoin(meeting, eq(meeting.id, meetingConsultantPayout.meetingId))
      .leftJoin(pyme, eq(pyme.id, meetingConsultantPayout.pymeId))
      .leftJoin(consultant, eq(consultant.id, meetingConsultantPayout.consultantId))
      .leftJoin(checkout, eq(checkout.id, meetingConsultantPayout.checkoutId));
  }
}
