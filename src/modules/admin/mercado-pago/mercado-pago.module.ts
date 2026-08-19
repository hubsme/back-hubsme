import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { CheckoutRepository } from '@repositories/checkout.repository';

import { ConsultantAvailabilityModule } from '../consultant-availability/consultant-availability.module';
import { MeetingModule } from '../meeting/meeting.module';
import { ConsultantModule } from '../consultant/consultant.module';
import { PymeModule } from '../pyme/pyme.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ServiceRequestModule } from '../service-request/service-request.module';
import { MercadoPagoController } from './mercado-pago.controller';
import { MercadoPagoService } from './mercado-pago.service';
import { MercadoPagoAccountModule } from './mercado-pago-account.module';

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || 'secret' }),
    MeetingModule,
    ConsultantAvailabilityModule,
    ConsultantModule,
    PymeModule,
    SubscriptionModule,
    ServiceRequestModule,
    MercadoPagoAccountModule,
  ],
  controllers: [MercadoPagoController],
  providers: [
    MercadoPagoService,
    ConsultantRepository,
    PymeRepository,
    CheckoutRepository,
    MeetingRepository,
  ],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
