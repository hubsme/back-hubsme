import { Module } from '@nestjs/common';
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

@Module({
  imports: [AdminAuthModule, AiModule, ConsultantAvailabilityModule, ScheduledNotificationModule],
  controllers: [MeetingAdminController, MeetingController],
  providers: [MeetingService, TeamsMeetingService, MeetingRepository, TaskRepository],
  exports: [MeetingService],
})
export class MeetingModule {}
