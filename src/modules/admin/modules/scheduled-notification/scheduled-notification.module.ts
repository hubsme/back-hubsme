import { ScheduledNotificationQuery } from '@queries/scheduled-notification/scheduled-notification.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { ConsultantAvailabilityQuery } from '@queries/consultant-availability/consultant-availability.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { PymeQuery } from '@queries/pyme/pyme.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { forwardRef, Module } from '@nestjs/common';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { WhatsappModule } from '@modules/admin/modules/whatsapp/whatsapp.module';
import { ScheduledNotificationService } from '@modules/admin/modules/scheduled-notification/scheduled-notification.service';
import { ConsultantAvailabilityReminderService } from '@modules/admin/modules/scheduled-notification/services/consultant-availability-reminder.service';

@Module({
  imports: [forwardRef(() => WhatsappModule), EmailModule],
  providers: [
    ScheduledNotificationService,
    ConsultantAvailabilityReminderService,
    ScheduledNotificationQuery,
    MeetingJoinQuery,
    ConsultantAvailabilityQuery,
    MeetingQuery,
    PymeQuery,
    PymeJoinQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
  ],
  exports: [ScheduledNotificationService],
})
export class ScheduledNotificationModule {}
