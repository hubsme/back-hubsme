import { Module } from '@nestjs/common';
import { CheckoutRepository } from '@repositories/checkout.repository';
import { PromotionCodeRepository } from '@repositories/promotion-code.repository';
import { MeetingRescheduleHistoryRepository } from '@repositories/meeting-reschedule-history.repository';
import { MeetingModule } from '../meeting/meeting.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ConsultantModule } from '../consultant/consultant.module';
import { PymeModule } from '../pyme/pyme.module';
import { ServiceRequestModule } from '../service-request/service-request.module';
import { PromotionCodeAdminController } from './promotion-code-admin.controller';
import { PromotionCodeController } from './promotion-code.controller';
import { PromotionCodeService } from './promotion-code.service';

@Module({
  imports: [AdminAuthModule, MeetingModule, ConsultantModule, PymeModule, ServiceRequestModule],
  controllers: [PromotionCodeAdminController, PromotionCodeController],
  providers: [
    PromotionCodeService,
    PromotionCodeRepository,
    CheckoutRepository,
    MeetingRescheduleHistoryRepository,
  ],
})
export class PromotionCodeModule {}
