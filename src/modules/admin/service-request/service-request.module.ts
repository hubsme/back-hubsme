import { Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ServiceRequestRepository } from '@repositories/service-request.repository';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService, ServiceRequestRepository, ConsultantRepository],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
