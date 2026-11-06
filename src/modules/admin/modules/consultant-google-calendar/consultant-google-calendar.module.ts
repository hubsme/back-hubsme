import { ConsultantGoogleCalendarQuery } from '@queries/consultant-google-calendar/consultant-google-calendar.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantGoogleCalendarController } from '@modules/admin/modules/consultant-google-calendar/consultant-google-calendar.controller';
import { ConsultantGoogleCalendarService } from '@modules/admin/modules/consultant-google-calendar/consultant-google-calendar.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'your-secret-key' })],
  controllers: [ConsultantGoogleCalendarController],
  providers: [ConsultantGoogleCalendarService, ConsultantGoogleCalendarQuery, ConsultantJoinQuery, ConsultantQuery],
  exports: [ConsultantGoogleCalendarService, ConsultantGoogleCalendarQuery],
})
export class ConsultantGoogleCalendarModule {}
