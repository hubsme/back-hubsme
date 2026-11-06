import { PromotionCodeQuery } from '@queries/promotion-code/promotion-code.query';
import { PromotionCodeRedemptionJoinQuery } from '@queries/promotion-code-redemption/promotion-code-redemption-join.query';
import { PromotionCodeRedemptionQuery } from '@queries/promotion-code-redemption/promotion-code-redemption.query';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { CheckoutJoinQuery } from '@queries/checkout/checkout-join.query';
import { MeetingRescheduleHistoryQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history.query';
import { MeetingRescheduleHistoryJoinQuery } from '@queries/meeting-reschedule-history/meeting-reschedule-history-join.query';
import { Module } from '@nestjs/common';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { ConsultantModule } from '@modules/admin/modules/consultant/consultant.module';
import { PymeModule } from '@modules/admin/modules/pyme/pyme.module';
import { ServiceRequestModule } from '@modules/admin/modules/service-request/service-request.module';
import { PromotionCodeAdminController } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/promotion-code-admin.controller';
import { PromotionCodeController } from '@modules/admin/modules/promotion-code/promotion-code.controller';
import { PromotionCodeService } from '@modules/admin/modules/promotion-code/promotion-code.service';

@Module({
  imports: [AdminAuthModule, MeetingModule, ConsultantModule, PymeModule, ServiceRequestModule],
  controllers: [PromotionCodeAdminController, PromotionCodeController],
  providers: [
    PromotionCodeService,
    PromotionCodeQuery,
    PromotionCodeRedemptionJoinQuery,
    PromotionCodeRedemptionQuery,
    CheckoutQuery,
    CheckoutJoinQuery,
    MeetingRescheduleHistoryQuery,
    MeetingRescheduleHistoryJoinQuery,
  ],
})
export class PromotionCodeModule {}
