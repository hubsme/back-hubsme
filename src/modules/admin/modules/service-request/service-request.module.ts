import { ServiceRequestJoinQuery } from '@queries/service-request/service-request-join.query';
import { ServiceRequestQuery } from '@queries/service-request/service-request.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { CheckoutJoinQuery } from '@queries/checkout/checkout-join.query';
import { ConsultantServiceOfferJoinQuery } from '@queries/consultant-service-offer/consultant-service-offer-join.query';
import { ConsultantServiceOfferQuery } from '@queries/consultant-service-offer/consultant-service-offer.query';
import { TaskJoinQuery } from '@queries/task/task-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { Module } from '@nestjs/common';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { StorageModule } from '@modules/storage/storage.module';
import { ConsultantAvailabilityModule } from '@modules/admin/modules/consultant-availability/consultant-availability.module';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { ServiceRequestController } from '@modules/admin/modules/service-request/service-request.controller';
import { ServiceRequestService } from '@modules/admin/modules/service-request/service-request.service';

@Module({
  imports: [AdminAuthModule, StorageModule, ConsultantAvailabilityModule, MeetingModule],
  controllers: [ServiceRequestController],
  providers: [
    ServiceRequestService,
    ServiceRequestJoinQuery,
    ServiceRequestQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
    MeetingQuery,
    MeetingJoinQuery,
    CheckoutQuery,
    CheckoutJoinQuery,
    ConsultantServiceOfferJoinQuery,
    ConsultantServiceOfferQuery,
    TaskJoinQuery,
    TaskQuery,
  ],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
