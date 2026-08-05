import { forwardRef, Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantAvailabilityRepository } from '@repositories/consultant-availability.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ScheduledNotificationRepository } from '@repositories/scheduled-notification.repository';
import { EmailModule } from '../email/email.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { ScheduledNotificationService } from './scheduled-notification.service';
import { ConsultantAvailabilityReminderService } from './consultant-availability-reminder.service';

@Module({
  imports: [forwardRef(() => WhatsappModule), EmailModule],
  providers: [
    ScheduledNotificationService,
    ConsultantAvailabilityReminderService,
    ScheduledNotificationRepository,
    ConsultantAvailabilityRepository,
    MeetingRepository,
    PymeRepository,
    ConsultantRepository,
  ],
  exports: [ScheduledNotificationService],
})
export class ScheduledNotificationModule {}
