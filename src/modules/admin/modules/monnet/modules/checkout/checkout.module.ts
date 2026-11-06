import { Module } from '@nestjs/common';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { ConsultantAvailabilityModule } from '@modules/admin/modules/consultant-availability/consultant-availability.module';
import { ConsultantModule } from '@modules/admin/modules/consultant/consultant.module';
import { PymeModule } from '@modules/admin/modules/pyme/pyme.module';
import { PayinModule } from '@modules/admin/modules/monnet/modules/payin/payin.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [PayinModule, MeetingModule, ConsultantAvailabilityModule, ConsultantModule, PymeModule],
  controllers: [CheckoutController],
  providers: [CheckoutService, CheckoutQuery, ConsultantJoinQuery, PymeJoinQuery],
  exports: [CheckoutService],
})
export class CheckoutModule {}
