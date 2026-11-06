import { Trace } from '@erixcel/traceflow';
import { ServiceRequestResultDto } from '@modules/admin/modules/service-request/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ServiceRequestRemoveMilestoneResultDto extends ServiceRequestResultDto {}
