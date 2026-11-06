import { Trace } from '@erixcel/traceflow';
import { ConsultantServiceOfferResultDto } from '@modules/admin/modules/consultant-service-offer/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ServiceOfferRemoveResultDto extends ConsultantServiceOfferResultDto {}
