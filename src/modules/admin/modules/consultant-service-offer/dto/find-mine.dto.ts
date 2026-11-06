import { Trace } from '@erixcel/traceflow';
import { ConsultantServiceOfferListDto } from '@modules/admin/modules/consultant-service-offer/dto/find-all.dto';

@Trace({ type: 'validation' })
export class ServiceOfferFindMineResultDto extends ConsultantServiceOfferListDto {}
