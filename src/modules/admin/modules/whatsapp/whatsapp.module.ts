import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { forwardRef, Module } from '@nestjs/common';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { WhatsappController } from '@modules/admin/modules/whatsapp/whatsapp.controller';
import { WhatsappService } from '@modules/admin/modules/whatsapp/whatsapp.service';

@Module({
  imports: [forwardRef(() => MeetingModule)],
  controllers: [WhatsappController],
  providers: [WhatsappService, ConsultantJoinQuery, ConsultantQuery],
  exports: [WhatsappService],
})
export class WhatsappModule {}
