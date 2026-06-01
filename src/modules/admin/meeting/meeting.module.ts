import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from '@repositories/meeting.repository';
import { TaskRepository } from '@repositories/task.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { TeamsMeetingService } from './teams-meeting.service';

@Module({
  controllers: [MeetingController],
  providers: [
    MeetingService,
    TeamsMeetingService,
    MeetingRepository,
    TaskRepository,
    PymeConsultantMatchRepository,
  ],
  exports: [MeetingService],
})
export class MeetingModule {}
