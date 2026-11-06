import { ConsultantAvailabilityQuery } from '@queries/consultant-availability/consultant-availability.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { Module } from '@nestjs/common';
import { ConsultantAvailabilityController } from '@modules/admin/modules/consultant-availability/consultant-availability.controller';
import { ConsultantAvailabilityService } from '@modules/admin/modules/consultant-availability/consultant-availability.service';
import { ConsultantGoogleCalendarModule } from '@modules/admin/modules/consultant-google-calendar/consultant-google-calendar.module';

@Module({
  imports: [ConsultantGoogleCalendarModule],
  controllers: [ConsultantAvailabilityController],
  providers: [
    ConsultantAvailabilityService,
    ConsultantAvailabilityQuery,
    MeetingQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
  ],
  exports: [ConsultantAvailabilityService, ConsultantAvailabilityQuery, MeetingQuery],
})
export class ConsultantAvailabilityModule {}
