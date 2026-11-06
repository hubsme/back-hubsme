import { Trace } from '@erixcel/traceflow';
import { ConsultantListDto } from '@modules/admin/modules/consultant/dto/find-all.dto';

@Trace({ type: 'validation' })
export class ConsultantAdminFindAllResultDto extends ConsultantListDto {}
