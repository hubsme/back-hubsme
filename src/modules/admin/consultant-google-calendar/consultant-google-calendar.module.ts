import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantGoogleCalendarRepository } from '@repositories/consultant-google-calendar.repository';
import { ConsultantGoogleCalendarController } from './consultant-google-calendar.controller';
import { ConsultantGoogleCalendarService } from './consultant-google-calendar.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'your-secret-key' })],
  controllers: [ConsultantGoogleCalendarController],
  providers: [ConsultantGoogleCalendarService, ConsultantGoogleCalendarRepository, ConsultantRepository],
  exports: [ConsultantGoogleCalendarService, ConsultantGoogleCalendarRepository],
})
export class ConsultantGoogleCalendarModule {}
