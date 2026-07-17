import { forwardRef, Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ScheduledNotificationRepository } from '@repositories/scheduled-notification.repository';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ScheduledNotificationService } from './scheduled-notification.service';

@Module({
  imports: [forwardRef(() => WhatsappModule)],
  providers: [ScheduledNotificationService, ScheduledNotificationRepository, PymeRepository, ConsultantRepository],
  exports: [ScheduledNotificationService],
})
export class ScheduledNotificationModule {}
