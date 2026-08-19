import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { meeting } from './meeting.table';
import { promotionCode, promotionCodeRedemption } from './promotion-code.table';
import { user } from './user.table';

export const meetingRescheduleHistory = pgTable(
  'meeting_reschedule_history',
  {
    id: serial('id').primaryKey(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
    rootMeetingId: integer('root_meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'restrict' }),
    sourceMeetingId: integer('source_meeting_id')
      .notNull()
      .references(() => meeting.id, { onDelete: 'restrict' }),
    replacementMeetingId: integer('replacement_meeting_id').references(() => meeting.id, {
      onDelete: 'set null',
    }),
    promotionCodeId: integer('promotion_code_id')
      .notNull()
      .references(() => promotionCode.id, { onDelete: 'restrict' }),
    promotionCodeRedemptionId: integer('promotion_code_redemption_id').references(
      () => promotionCodeRedemption.id,
      { onDelete: 'set null' },
    ),
    cancellationReason: text('cancellation_reason'),
    cancelledBy: integer('cancelled_by').references(() => user.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('meeting_reschedule_history_root_meeting_idx').on(t.rootMeetingId),
    index('meeting_reschedule_history_source_meeting_idx').on(t.sourceMeetingId),
    index('meeting_reschedule_history_replacement_meeting_idx').on(t.replacementMeetingId),
    index('meeting_reschedule_history_promotion_code_idx').on(t.promotionCodeId),
    index('meeting_reschedule_history_redemption_idx').on(t.promotionCodeRedemptionId),
    index('meeting_reschedule_history_created_at_idx').on(t.createdAt),
  ],
);

export type MeetingRescheduleHistory = typeof meetingRescheduleHistory.$inferSelect;
export type MeetingRescheduleHistoryDTO = typeof meetingRescheduleHistory.$inferInsert;
