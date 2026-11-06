import { Trace } from '@erixcel/traceflow';
import { MeetingListDto } from '@modules/admin/modules/meeting/dto/find-all.dto';

@Trace({ type: 'validation' })
export class MeetingAdminFindAllResultDto extends MeetingListDto {}
