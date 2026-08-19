import { forwardRef, Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from '@repositories/meeting.repository';
import { TaskRepository } from '@repositories/task.repository';
import { TeamsMeetingService } from './teams-meeting.service';
import { AiModule } from '../ai/ai.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ConsultantAvailabilityModule } from '../consultant-availability/consultant-availability.module';
import { MeetingAdminController } from './meeting-admin.controller';
import { ScheduledNotificationModule } from '../scheduled-notification/scheduled-notification.module';
import { StorageModule } from '../../storage/storage.module';
import { MeetingConsultantPayoutRepository } from '@repositories/meeting-consultant-payout.repository';
import { MeetingConsultantPayoutService } from './meeting-consultant-payout.service';
import { MeetingRescheduleHistoryRepository } from '@repositories/meeting-reschedule-history.repository';

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
    MeetingRepository,
    MeetingConsultantPayoutRepository,
    MeetingRescheduleHistoryRepository,
    TaskRepository,
  ],
  exports: [MeetingService, MeetingConsultantPayoutService, MeetingRescheduleHistoryRepository],
})
export class MeetingModule {}
