import { Trace } from '@erixcel/traceflow';
import { ConsultantAvailabilityResultDto } from '@modules/admin/modules/consultant-availability/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ConsultantAvailabilityRemoveResultDto extends ConsultantAvailabilityResultDto {}
