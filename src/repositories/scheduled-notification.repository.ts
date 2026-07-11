import { Injectable } from '@nestjs/common';
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meeting } from '@db/tables/meeting.table';
import { ScheduledNotificationDTO, scheduledNotification } from '@db/tables/scheduled-notification.table';

type NewScheduledNotification = Pick<
  ScheduledNotificationDTO,
  'meetingId' | 'recipient' | 'scheduledAt' | 'expiresAt' | 'payload' | 'maxAttempts'
>;

@Injectable()
export class ScheduledNotificationRepository {
  async replacePendingForMeeting(meetingId: number, notifications: NewScheduledNotification[]) {
    return database.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${meetingId})`);

      const cancelled = await tx
        .update(scheduledNotification)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(scheduledNotification.meetingId, meetingId),
            inArray(scheduledNotification.status, ['pending', 'processing']),
          ),
        )
        .returning({ id: scheduledNotification.id });

      const created = notifications.length
        ? await tx.insert(scheduledNotification).values(notifications).returning()
        : [];

      return { cancelledIds: cancelled.map((item) => item.id), created };
    });
  }

  async cancelPendingForMeeting(meetingId: number) {
    return database.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${meetingId})`);
      return tx
        .update(scheduledNotification)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(scheduledNotification.meetingId, meetingId),
            inArray(scheduledNotification.status, ['pending', 'processing']),
          ),
        )
        .returning({ id: scheduledNotification.id });
    });
  }

  async findPending() {
    return database
      .select()
      .from(scheduledNotification)
      .where(eq(scheduledNotification.status, 'pending'))
      .orderBy(asc(scheduledNotification.scheduledAt));
  }

  async expirePending(now: Date) {
    return database
      .update(scheduledNotification)
      .set({
        status: 'cancelled',
        lastError: 'La reunion ya comenzo antes de procesar el recordatorio',
        updatedAt: now,
      })
      .where(and(eq(scheduledNotification.status, 'pending'), lte(scheduledNotification.expiresAt, now)))
      .returning({ id: scheduledNotification.id });
  }

  async claim(id: number, now: Date) {
    const result = await database
      .update(scheduledNotification)
      .set({
        status: 'processing',
        attempts: sql`${scheduledNotification.attempts} + 1`,
        lockedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(scheduledNotification.id, id),
          eq(scheduledNotification.status, 'pending'),
          lte(scheduledNotification.scheduledAt, now),
          gt(scheduledNotification.expiresAt, now),
        ),
      )
      .returning();

    return result[0];
  }

  async markCompleted(id: number) {
    const now = new Date();
    await database
      .update(scheduledNotification)
      .set({ status: 'completed', processedAt: now, lockedAt: null, lastError: null, updatedAt: now })
      .where(and(eq(scheduledNotification.id, id), eq(scheduledNotification.status, 'processing')));
  }

  async markFailed(id: number, error: string) {
    await database
      .update(scheduledNotification)
      .set({ status: 'failed', lockedAt: null, lastError: error, updatedAt: new Date() })
      .where(and(eq(scheduledNotification.id, id), eq(scheduledNotification.status, 'processing')));
  }

  async scheduleRetry(id: number, scheduledAt: Date, error: string) {
    const result = await database
      .update(scheduledNotification)
      .set({
        status: 'pending',
        scheduledAt,
        lockedAt: null,
        lastError: error,
        updatedAt: new Date(),
      })
      .where(and(eq(scheduledNotification.id, id), eq(scheduledNotification.status, 'processing')))
      .returning();

    return result[0];
  }

  async recoverStaleProcessing(staleBefore: Date) {
    return database
      .update(scheduledNotification)
      .set({ status: 'pending', lockedAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(scheduledNotification.status, 'processing'),
          or(isNull(scheduledNotification.lockedAt), lte(scheduledNotification.lockedAt, staleBefore)),
        ),
      )
      .returning({ id: scheduledNotification.id });
  }

  async findConfirmedUpcomingMeetingsWithoutNotifications(now: Date) {
    return database
      .select()
      .from(meeting)
      .where(
        and(
          eq(meeting.status, 'confirmada'),
          gt(meeting.startTime, now),
          isNull(meeting.deletedAt),
          sql`NOT EXISTS (
            SELECT 1
            FROM scheduled_notification existing_notification
            WHERE existing_notification.meeting_id = ${meeting.id}
          )`,
        ),
      );
  }
}
