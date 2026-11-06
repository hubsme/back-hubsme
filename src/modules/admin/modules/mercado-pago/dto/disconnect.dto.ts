import { Trace } from '@erixcel/traceflow';
import { MercadoPagoStatusDto } from '@modules/admin/modules/mercado-pago/dto/status.dto';

@Trace({ type: 'validation' })
export class MercadoPagoDisconnectResultDto extends MercadoPagoStatusDto {}
