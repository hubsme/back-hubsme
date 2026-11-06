import { Trace } from '@erixcel/traceflow';
import { MercadoPagoCheckoutDto } from '@modules/admin/modules/mercado-pago/dto/create-checkout.dto';

@Trace({ type: 'validation' })
export class MercadoPagoSyncServicePaymentResultDto extends MercadoPagoCheckoutDto {}
