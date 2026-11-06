import { Trace } from '@erixcel/traceflow';
import { PymeListFiltersDto } from '@modules/admin/modules/pyme/dto/find-all.dto';

@Trace({ type: 'validation' })
export class ConsultantMeetingPymesFiltersDto extends PymeListFiltersDto {}
