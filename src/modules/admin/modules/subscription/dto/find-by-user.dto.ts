import { Trace } from '@erixcel/traceflow';
import { SubscriptionResultDto } from '@modules/admin/modules/subscription/dto/find-one.dto';

@Trace({ type: 'validation' })
export class SubscriptionFindByUserResultDto extends SubscriptionResultDto {}
