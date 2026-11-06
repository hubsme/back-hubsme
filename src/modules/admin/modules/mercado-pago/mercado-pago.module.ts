import { CheckoutModule as MonnetCheckoutModule } from '@modules/admin/modules/monnet/modules/checkout/checkout.module';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { PymeQuery } from '@queries/pyme/pyme.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { CheckoutQuery } from '@queries/checkout/checkout.query';
import { CheckoutJoinQuery } from '@queries/checkout/checkout-join.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { ConsultantMercadoPagoAccountQuery } from '@queries/consultant-mercado-pago-account/consultant-mercado-pago-account.query';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantAvailabilityModule } from '@modules/admin/modules/consultant-availability/consultant-availability.module';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { ConsultantModule } from '@modules/admin/modules/consultant/consultant.module';
import { PymeModule } from '@modules/admin/modules/pyme/pyme.module';
import { SubscriptionModule } from '@modules/admin/modules/subscription/subscription.module';
import { ServiceRequestModule } from '@modules/admin/modules/service-request/service-request.module';
import { MercadoPagoController } from '@modules/admin/modules/mercado-pago/mercado-pago.controller';
import { MercadoPagoService } from '@modules/admin/modules/mercado-pago/mercado-pago.service';
import { MercadoPagoAccountModule } from '@modules/admin/modules/mercado-pago/modules/mercado-pago-account/mercado-pago-account.module';

@Module({
  imports: [MonnetCheckoutModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'secret' }), MeetingModule, ConsultantAvailabilityModule, ConsultantModule, PymeModule, SubscriptionModule, ServiceRequestModule, MercadoPagoAccountModule],
  controllers: [MercadoPagoController],
  providers: [MercadoPagoService, ConsultantJoinQuery, ConsultantQuery, PymeQuery, PymeJoinQuery, CheckoutQuery, CheckoutJoinQuery, MeetingQuery, MeetingJoinQuery, ConsultantMercadoPagoAccountQuery],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
