import { Module } from '@nestjs/common';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { MercadoPagoAccountService } from './mercado-pago-account.service';

@Module({
  providers: [ConsultantMercadoPagoAccountRepository, MercadoPagoAccountService],
  exports: [ConsultantMercadoPagoAccountRepository, MercadoPagoAccountService],
})
export class MercadoPagoAccountModule {}
