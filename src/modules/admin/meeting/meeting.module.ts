import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from '@repositories/meeting.repository';
import { TaskRepository } from '@repositories/task.repository';
import { TeamsMeetingService } from './teams-meeting.service';
import { AiModule } from '../ai/ai.module';
import { ConsultantAvailabilityModule } from '../consultant-availability/consultant-availability.module';

@Module({
  imports: [AiModule, ConsultantAvailabilityModule],
  controllers: [MeetingController],
  providers: [
    MeetingService,
    TeamsMeetingService,
    MeetingRepository,
    TaskRepository,
  ],
  exports: [MeetingService],
})
export class MeetingModule {}
