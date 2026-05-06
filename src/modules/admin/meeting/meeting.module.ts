import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from '@repositories/meeting.repository';
import { TaskRepository } from '@repositories/task.repository';
import { GeminiService } from '@modules/admin/common/gemini.service';

@Module({
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository, TaskRepository, GeminiService],
  exports: [MeetingService],
})
export class MeetingModule {}
