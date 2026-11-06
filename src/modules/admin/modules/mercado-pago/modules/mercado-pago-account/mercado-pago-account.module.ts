import { ConsultantMercadoPagoAccountQuery } from '@queries/consultant-mercado-pago-account/consultant-mercado-pago-account.query';
import { Module } from '@nestjs/common';
import { MercadoPagoAccountService } from '@modules/admin/modules/mercado-pago/modules/mercado-pago-account/mercado-pago-account.service';

@Module({
  providers: [ConsultantMercadoPagoAccountQuery, MercadoPagoAccountService],
  exports: [ConsultantMercadoPagoAccountQuery, MercadoPagoAccountService],
})
export class MercadoPagoAccountModule {}
