import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { meetingRescheduleHistory } from '@db/tables/meeting-reschedule-history.table';
import { meeting } from '@db/tables/meeting.table';
import { promotionCodeRedemption } from '@db/tables/promotion-code-redemption.table';
import { promotionCode } from '@db/tables/promotion-code.table';
import { and, asc, eq, isNull, sql } from 'drizzle-orm';

@Injectable()
export class MeetingRescheduleHistoryJoinQuery {
  @TraceNode({ name: 'meeting-reschedule-history.findDetailedChainByRootMeetingId', type: 'method' })
  async findDetailedChainByRootMeetingId(rootMeetingId: number) {
    const sourceAlias = meeting;
    const replacementMeetingAlias = sql`replacement_meeting`;
    const cancelledByAlias = sql`cancelled_by_user`;
    return database
      .select({
        id: meetingRescheduleHistory.id,
        createdAt: meetingRescheduleHistory.createdAt,
        updatedAt: meetingRescheduleHistory.updatedAt,
        rootMeetingId: meetingRescheduleHistory.rootMeetingId,
        sourceMeetingId: meetingRescheduleHistory.sourceMeetingId,
        replacementMeetingId: meetingRescheduleHistory.replacementMeetingId,
        promotionCodeId: meetingRescheduleHistory.promotionCodeId,
        promotionCodeRedemptionId: meetingRescheduleHistory.promotionCodeRedemptionId,
        cancellationReason: meetingRescheduleHistory.cancellationReason,
        cancelledBy: meetingRescheduleHistory.cancelledBy,
        sourceMeetingTitle: sourceAlias.title,
        sourceMeetingStartTime: sourceAlias.startTime,
        sourceMeetingStatus: sourceAlias.status,
        sourceMeetingDurationMinutes: sourceAlias.durationMinutes,
        promotionCode: promotionCode.code,
        promotionCodeExpiresAt: promotionCode.expiresAt,
        promotionCodeIsActive: promotionCode.isActive,
        redeemedAt: promotionCodeRedemption.redeemedAt,
        cancelledByName: sql<
          string | null
        >`COALESCE(${cancelledByAlias}.name || ' ' || ${cancelledByAlias}.last_name, ${cancelledByAlias}.email)`,
        replacementMeetingTitle: sql<string | null>`${replacementMeetingAlias}.title`,
        replacementMeetingStartTime: sql<Date | null>`${replacementMeetingAlias}.start_time`,
        replacementMeetingStatus: sql<string | null>`${replacementMeetingAlias}.status`,
        replacementMeetingUrl: sql<string | null>`${replacementMeetingAlias}.meeting_url`,
        replacementMeetingCompletedAt: sql<Date | null>`${replacementMeetingAlias}.completed_at`,
      })
      .from(meetingRescheduleHistory)
      .innerJoin(sourceAlias, eq(sourceAlias.id, meetingRescheduleHistory.sourceMeetingId))
      .innerJoin(promotionCode, eq(promotionCode.id, meetingRescheduleHistory.promotionCodeId))
      .leftJoin(
        promotionCodeRedemption,
        eq(promotionCodeRedemption.id, meetingRescheduleHistory.promotionCodeRedemptionId),
      )
      .leftJoin(
        sql`meeting AS ${replacementMeetingAlias}`,
        sql`${replacementMeetingAlias}.id = ${meetingRescheduleHistory.replacementMeetingId}`,
      )
      .leftJoin(
        sql`app_user AS ${cancelledByAlias}`,
        sql`${cancelledByAlias}.id = ${meetingRescheduleHistory.cancelledBy}`,
      )
      .where(and(eq(meetingRescheduleHistory.rootMeetingId, rootMeetingId), isNull(meetingRescheduleHistory.deletedAt)))
      .orderBy(asc(meetingRescheduleHistory.createdAt), asc(meetingRescheduleHistory.id));
  }
}
