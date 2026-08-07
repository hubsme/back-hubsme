import { Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { ServiceRequestRepository } from '@repositories/service-request.repository';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { StorageModule } from '../../storage/storage.module';
import { ConsultantAvailabilityModule } from '../consultant-availability/consultant-availability.module';
import { MeetingModule } from '../meeting/meeting.module';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [AdminAuthModule, StorageModule, ConsultantAvailabilityModule, MeetingModule],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService, ServiceRequestRepository, ConsultantRepository, MeetingRepository],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
