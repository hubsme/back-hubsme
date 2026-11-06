import { database, transaction } from '@db/connection.db';
import { meetingRescheduleHistory } from '@db/tables/meeting-reschedule-history.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class MeetingRescheduleHistoryQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'meeting-reschedule-history.create', type: 'method' })
  async create(data: typeof meetingRescheduleHistory.$inferInsert) {
    const result = await database.insert(meetingRescheduleHistory).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'meeting-reschedule-history.updateReplacementByPromotionCodeId', type: 'method' })
  async updateReplacementByPromotionCodeId(
    promotionCodeId: number,
    data: {
      replacementMeetingId: number;
      promotionCodeRedemptionId: number;
    },
  ) {
    const result = await database
      .update(meetingRescheduleHistory)
      .set({
        replacementMeetingId: data.replacementMeetingId,
        promotionCodeRedemptionId: data.promotionCodeRedemptionId,
        updatedAt: new Date(),
      })
      .where(
        and(eq(meetingRescheduleHistory.promotionCodeId, promotionCodeId), isNull(meetingRescheduleHistory.deletedAt)),
      )
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'meeting-reschedule-history.findByRootMeetingId', type: 'method' })
  async findByRootMeetingId(rootMeetingId: number) {
    return database
      .select()
      .from(meetingRescheduleHistory)
      .where(and(eq(meetingRescheduleHistory.rootMeetingId, rootMeetingId), isNull(meetingRescheduleHistory.deletedAt)))
      .orderBy(asc(meetingRescheduleHistory.createdAt), asc(meetingRescheduleHistory.id));
  }

  @TraceNode({ name: 'meeting-reschedule-history.findRootMeetingId', type: 'method' })
  async findRootMeetingId(meetingId: number): Promise<number> {
    const parent = await database
      .select({ rootMeetingId: meetingRescheduleHistory.rootMeetingId })
      .from(meetingRescheduleHistory)
      .where(
        and(eq(meetingRescheduleHistory.replacementMeetingId, meetingId), isNull(meetingRescheduleHistory.deletedAt)),
      )
      .limit(1);
    if (parent[0]?.rootMeetingId) {
      return parent[0].rootMeetingId;
    }
    const current = await database
      .select({ rootMeetingId: meetingRescheduleHistory.rootMeetingId })
      .from(meetingRescheduleHistory)
      .where(and(eq(meetingRescheduleHistory.sourceMeetingId, meetingId), isNull(meetingRescheduleHistory.deletedAt)))
      .limit(1);
    return current[0]?.rootMeetingId ?? meetingId;
  }

  @TraceNode({ name: 'meeting-reschedule-history.findLatestActiveMeetingIdInChain', type: 'method' })
  async findLatestActiveMeetingIdInChain(rootMeetingId: number): Promise<number> {
    const history = await this.findByRootMeetingId(rootMeetingId);
    if (!history.length) return rootMeetingId;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].replacementMeetingId) {
        return history[i].replacementMeetingId!;
      }
    }
    return rootMeetingId;
  }

  @TraceNode({ name: 'meeting-reschedule-history.findParentByReplacementMeetingId', type: 'method' })
  async findParentByReplacementMeetingId(id: number) {
    return database
      .select({ rootMeetingId: meetingRescheduleHistory.rootMeetingId })
      .from(meetingRescheduleHistory)
      .where(and(eq(meetingRescheduleHistory.replacementMeetingId, id), isNull(meetingRescheduleHistory.deletedAt)))
      .limit(1);
  }
}
