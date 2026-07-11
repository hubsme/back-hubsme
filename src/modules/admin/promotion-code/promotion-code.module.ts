import { Module } from '@nestjs/common';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';
import { PromotionCodeRepository } from '@repositories/promotion-code.repository';
import { MeetingModule } from '../meeting/meeting.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ConsultantModule } from '../consultant/consultant.module';
import { PymeModule } from '../pyme/pyme.module';
import { PromotionCodeAdminController } from './promotion-code-admin.controller';
import { PromotionCodeController } from './promotion-code.controller';
import { PromotionCodeService } from './promotion-code.service';

@Module({
  imports: [AdminAuthModule, MeetingModule, ConsultantModule, PymeModule],
  controllers: [PromotionCodeAdminController, PromotionCodeController],
  providers: [PromotionCodeService, PromotionCodeRepository, MercadoPagoPaymentRepository],
})
export class PromotionCodeModule {}
