import { Trace } from '@erixcel/traceflow';
import { ConsultantResultDto } from '@modules/admin/modules/consultant/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ConsultantAdminRemoveResultDto extends ConsultantResultDto {}
