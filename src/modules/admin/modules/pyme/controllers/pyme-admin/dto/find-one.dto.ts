import { Trace } from '@erixcel/traceflow';
import { PymeResultDto } from '@modules/admin/modules/pyme/dto/find-one.dto';

@Trace({ type: 'validation' })
export class PymeAdminFindOneResultDto extends PymeResultDto {}
