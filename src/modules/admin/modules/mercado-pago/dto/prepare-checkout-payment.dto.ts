import { Trace } from '@erixcel/traceflow';
import { MonnetCheckoutResultDto } from '@modules/admin/modules/monnet/modules/checkout/dto/create-checkout.dto';

@Trace({ type: 'validation' })
export class MercadoPagoPrepareCheckoutPaymentResultDto extends MonnetCheckoutResultDto {}
