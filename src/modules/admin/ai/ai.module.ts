import { Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { AiService } from './ai.service';
import { IaController } from './ai.controller';

@Module({
  controllers: [IaController],
  providers: [AiService, ConsultantRepository, MeetingRepository],
  exports: [AiService],
})
export class AiModule {}
