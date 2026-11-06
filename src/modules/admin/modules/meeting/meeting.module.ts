import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { MeetingConsultantPayoutQuery } from '@queries/meeting-consultant-payout/meeting-consultant-payout.query';
import { MeetingConsultantPayoutJoinQuery } from '@queries/meeting-consultant-payout/meeting-consultant-payout-join.query';
import { MeetingRescheduleHistoryQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history.query';
import { MeetingRescheduleHistoryJoinQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history-join.query';
import { TaskJoinQuery } from '@queries/task/task-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { PromotionCodeQuery } from '@queries/promotion-code/promotion-code.query';
import { forwardRef, Module } from '@nestjs/common';
import { MeetingController } from '@modules/admin/modules/meeting/meeting.controller';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';
import { TeamsMeetingService } from '@modules/admin/modules/meeting/services/teams-meeting.service';
import { AiModule } from '@modules/admin/modules/ai/ai.module';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { ConsultantAvailabilityModule } from '@modules/admin/modules/consultant-availability/consultant-availability.module';
import { MeetingAdminController } from '@modules/admin/modules/meeting/controllers/meeting-admin/meeting-admin.controller';
import { ScheduledNotificationModule } from '@modules/admin/modules/scheduled-notification/scheduled-notification.module';
import { StorageModule } from '@modules/storage/storage.module';
import { MeetingConsultantPayoutService } from '@modules/admin/modules/meeting/services/meeting-consultant-payout.service';

@Module({
  imports: [
    AdminAuthModule,
    AiModule,
    ConsultantAvailabilityModule,
    StorageModule,
    forwardRef(() => ScheduledNotificationModule),
  ],
  controllers: [MeetingAdminController, MeetingController],
  providers: [
    MeetingService,
    MeetingConsultantPayoutService,
    TeamsMeetingService,
    MeetingQuery,
    MeetingJoinQuery,
    MeetingConsultantPayoutQuery,
    MeetingConsultantPayoutJoinQuery,
    MeetingRescheduleHistoryQuery,
    MeetingRescheduleHistoryJoinQuery,
    TaskJoinQuery,
    TaskQuery,
    PromotionCodeQuery,
  ],
  exports: [
    MeetingService,
    MeetingConsultantPayoutService,
    MeetingRescheduleHistoryQuery,
    MeetingRescheduleHistoryJoinQuery,
  ],
})
export class MeetingModule {}
