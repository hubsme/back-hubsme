import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { scheduledNotification } from '@db/tables/scheduled-notification.table';
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';

@Injectable()
export class ScheduledNotificationQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'scheduled-notification.replacePendingForMeeting', type: 'method' })
  async replacePendingForMeeting(
    meetingId: number,
    notifications: Pick<
      typeof scheduledNotification.$inferInsert,
      'meetingId' | 'recipient' | 'scheduledAt' | 'expiresAt' | 'payload' | 'maxAttempts'
    >[],
  ) {
    return this.transaction(async () => {
      await database.execute(sql`SELECT pg_advisory_xact_lock(${meetingId})`);
      const cancelled = await database
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
        ? await database.insert(scheduledNotification).values(notifications).returning()
        : [];
      return { cancelledIds: cancelled.map((item) => item.id), created };
    });
  }

  @TraceNode({ name: 'scheduled-notification.cancelPendingForMeeting', type: 'method' })
  async cancelPendingForMeeting(meetingId: number) {
    return this.transaction(async () => {
      await database.execute(sql`SELECT pg_advisory_xact_lock(${meetingId})`);
      return database
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

  @TraceNode({ name: 'scheduled-notification.findPending', type: 'method' })
  async findPending() {
    return database
      .select()
      .from(scheduledNotification)
      .where(eq(scheduledNotification.status, 'pending'))
      .orderBy(asc(scheduledNotification.scheduledAt));
  }

  @TraceNode({ name: 'scheduled-notification.expirePending', type: 'method' })
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

  @TraceNode({ name: 'scheduled-notification.claim', type: 'method' })
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

  @TraceNode({ name: 'scheduled-notification.markCompleted', type: 'method' })
  async markCompleted(id: number) {
    const now = new Date();
    await database
      .update(scheduledNotification)
      .set({ status: 'completed', processedAt: now, lockedAt: null, lastError: null, updatedAt: now })
      .where(and(eq(scheduledNotification.id, id), eq(scheduledNotification.status, 'processing')));
  }

  @TraceNode({ name: 'scheduled-notification.markFailed', type: 'method' })
  async markFailed(id: number, error: string) {
    await database
      .update(scheduledNotification)
      .set({ status: 'failed', lockedAt: null, lastError: error, updatedAt: new Date() })
      .where(and(eq(scheduledNotification.id, id), eq(scheduledNotification.status, 'processing')));
  }

  @TraceNode({ name: 'scheduled-notification.scheduleRetry', type: 'method' })
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

  @TraceNode({ name: 'scheduled-notification.recoverStaleProcessing', type: 'method' })
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
}
