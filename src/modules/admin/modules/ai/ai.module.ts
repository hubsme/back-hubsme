import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { TaskJoinQuery } from '@queries/task/task-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { Module } from '@nestjs/common';
import { AiService } from '@modules/admin/modules/ai/ai.service';
import { AiController } from '@modules/admin/modules/ai/ai.controller';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    ConsultantJoinQuery,
    ConsultantQuery,
    MeetingQuery,
    MeetingJoinQuery,
    TaskJoinQuery,
    TaskQuery,
  ],
  exports: [AiService],
})
export class AiModule {}
