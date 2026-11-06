import { Trace } from '@erixcel/traceflow';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';

@Trace({ type: 'validation' })
export class MeetingConfirmResultDto extends MeetingResultDto {}
