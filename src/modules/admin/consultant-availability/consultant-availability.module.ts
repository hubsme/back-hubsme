import { Module } from '@nestjs/common';
import { ConsultantAvailabilityController } from './consultant-availability.controller';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { ConsultantAvailabilityRepository } from '@repositories/consultant-availability.repository';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantGoogleCalendarModule } from '../consultant-google-calendar/consultant-google-calendar.module';

@Module({
  imports: [ConsultantGoogleCalendarModule],
  controllers: [ConsultantAvailabilityController],
  providers: [ConsultantAvailabilityService, ConsultantAvailabilityRepository, ConsultantRepository],
  exports: [ConsultantAvailabilityService, ConsultantAvailabilityRepository],
})
export class ConsultantAvailabilityModule {}
