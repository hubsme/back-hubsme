import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  meetingRescheduleHistory,
  MeetingRescheduleHistoryDTO,
} from '@db/tables/meeting-reschedule-history.table';
import { meeting } from '@db/tables/meeting.table';
import { promotionCode, promotionCodeRedemption } from '@db/tables/promotion-code.table';
import { user } from '@db/tables/user.table';

@Injectable()
export class MeetingRescheduleHistoryRepository {
  async create(data: MeetingRescheduleHistoryDTO) {
    const result = await database.insert(meetingRescheduleHistory).values(data).returning();
    return result[0];
  }

  async updateReplacementByPromotionCodeId(
    promotionCodeId: number,
    data: { replacementMeetingId: number; promotionCodeRedemptionId: number },
  ) {
    const result = await database
      .update(meetingRescheduleHistory)
      .set({
        replacementMeetingId: data.replacementMeetingId,
        promotionCodeRedemptionId: data.promotionCodeRedemptionId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(meetingRescheduleHistory.promotionCodeId, promotionCodeId),
          isNull(meetingRescheduleHistory.deletedAt),
        ),
      )
      .returning();

    return result[0];
  }

  async findByRootMeetingId(rootMeetingId: number) {
    return database
      .select()
      .from(meetingRescheduleHistory)
      .where(
        and(
          eq(meetingRescheduleHistory.rootMeetingId, rootMeetingId),
          isNull(meetingRescheduleHistory.deletedAt),
        ),
      )
      .orderBy(asc(meetingRescheduleHistory.createdAt), asc(meetingRescheduleHistory.id));
  }

  async findRootMeetingId(meetingId: number): Promise<number> {
    const parent = await database
      .select({ rootMeetingId: meetingRescheduleHistory.rootMeetingId })
      .from(meetingRescheduleHistory)
      .where(
        and(
          eq(meetingRescheduleHistory.replacementMeetingId, meetingId),
          isNull(meetingRescheduleHistory.deletedAt),
        ),
      )
      .limit(1);

    if (parent[0]?.rootMeetingId) {
      return parent[0].rootMeetingId;
    }

    const current = await database
      .select({ rootMeetingId: meetingRescheduleHistory.rootMeetingId })
      .from(meetingRescheduleHistory)
      .where(
        and(
          eq(meetingRescheduleHistory.sourceMeetingId, meetingId),
          isNull(meetingRescheduleHistory.deletedAt),
        ),
      )
      .limit(1);

    return current[0]?.rootMeetingId ?? meetingId;
  }

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
        cancelledByName: sql<string | null>`COALESCE(${cancelledByAlias}.name || ' ' || ${cancelledByAlias}.last_name, ${cancelledByAlias}.email)`,
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
      .where(
        and(
          eq(meetingRescheduleHistory.rootMeetingId, rootMeetingId),
          isNull(meetingRescheduleHistory.deletedAt),
        ),
      )
      .orderBy(asc(meetingRescheduleHistory.createdAt), asc(meetingRescheduleHistory.id));
  }

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
}
