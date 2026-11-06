import { Trace } from '@erixcel/traceflow';
import { TaskResultDto } from '@modules/admin/modules/task/dto/find-one.dto';

@Trace({ type: 'validation' })
export class TaskRemoveResultDto extends TaskResultDto {}
