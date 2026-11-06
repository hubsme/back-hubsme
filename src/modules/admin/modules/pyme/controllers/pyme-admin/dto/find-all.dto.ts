import { Trace } from '@erixcel/traceflow';
import { PymeListDto } from '@modules/admin/modules/pyme/dto/find-all.dto';

@Trace({ type: 'validation' })
export class PymeAdminFindAllResultDto extends PymeListDto {}
