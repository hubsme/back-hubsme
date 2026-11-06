import { Trace } from '@erixcel/traceflow';
import { ConsultantAvailabilityMonthDto } from '@modules/admin/modules/consultant-availability/dto/find-month.dto';

@Trace({ type: 'validation' })
export class ConsultantAvailabilityVisibleMonthResultDto extends ConsultantAvailabilityMonthDto {}
