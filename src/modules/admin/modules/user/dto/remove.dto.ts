import { Trace } from '@erixcel/traceflow';
import { UserResultDto } from '@modules/admin/modules/user/dto/find-one.dto';

@Trace({ type: 'validation' })
export class UserRemoveResultDto extends UserResultDto {}
