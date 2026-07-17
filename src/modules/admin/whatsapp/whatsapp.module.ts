import { forwardRef, Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MeetingModule } from '../meeting/meeting.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [forwardRef(() => MeetingModule)],
  controllers: [WhatsappController],
  providers: [WhatsappService, ConsultantRepository],
  exports: [WhatsappService],
})
export class WhatsappModule {}
