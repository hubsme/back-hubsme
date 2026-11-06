import { Trace } from '@erixcel/traceflow';
import { ConsultantListFiltersDto } from '@modules/admin/modules/consultant/dto/find-all.dto';

@Trace({ type: 'validation' })
export class PymeMeetingConsultantsFiltersDto extends ConsultantListFiltersDto {}
