import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';

import { ConsultantAvailabilityModule } from '../consultant-availability/consultant-availability.module';
import { MeetingModule } from '../meeting/meeting.module';
import { ConsultantModule } from '../consultant/consultant.module';
import { PymeModule } from '../pyme/pyme.module';
import { SubscriptionModule } from '../subscription/subscription.module';
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
  ],
  controllers: [MercadoPagoController],
  providers: [
    MercadoPagoService,
    ConsultantRepository,
    PymeRepository,
    ConsultantMercadoPagoAccountRepository,
    MercadoPagoPaymentRepository,
    MeetingRepository,
  ],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
