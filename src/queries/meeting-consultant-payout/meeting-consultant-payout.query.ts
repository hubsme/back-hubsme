import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { meetingConsultantPayout } from '@db/tables/meeting-consultant-payout.table';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class MeetingConsultantPayoutQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'meeting-consultant-payout.createPending', type: 'method' })
  async createPending(data: typeof meetingConsultantPayout.$inferInsert) {
    const inserted = await database
      .insert(meetingConsultantPayout)
      .values(data)
      .onConflictDoNothing()
      .returning({ id: meetingConsultantPayout.id });
    return inserted[0];
  }

  @TraceNode({ name: 'meeting-consultant-payout.markPaid', type: 'method' })
  async markPaid(
    id: number,
    data: Pick<
      typeof meetingConsultantPayout.$inferInsert,
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
    return updated[0];
  }

  @TraceNode({ name: 'meeting-consultant-payout.updatePendingFinancials', type: 'method' })
  async updatePendingFinancials(
    id: number,
    data: Pick<
      typeof meetingConsultantPayout.$inferInsert,
      'amount' | 'mercadoPagoFeeAmount' | 'mercadoPagoFeePercent'
    >,
  ) {
    const updated = await database
      .update(meetingConsultantPayout)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(meetingConsultantPayout.id, id), eq(meetingConsultantPayout.status, 'pending')))
      .returning({ id: meetingConsultantPayout.id });
    return updated[0];
  }
}
