import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
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

@Module({
  imports: [
    JwtModule.register({ secret: process.env.JWT_SECRET || 'secret' }),
    MeetingModule,
    ConsultantAvailabilityModule,
    ConsultantModule,
    PymeModule,
    SubscriptionModule,
    ServiceRequestModule,
  ],
  controllers: [MercadoPagoController],
  providers: [
    MercadoPagoService,
    ConsultantRepository,
    PymeRepository,
    ConsultantMercadoPagoAccountRepository,
    CheckoutRepository,
    MeetingRepository,
  ],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
