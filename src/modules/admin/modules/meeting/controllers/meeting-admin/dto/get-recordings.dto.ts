import { Trace } from '@erixcel/traceflow';
import { MeetingRecordingDto } from '@modules/admin/modules/meeting/dto/get-recordings.dto';

@Trace({ type: 'validation' })
export class MeetingAdminGetRecordingsResultDto extends MeetingRecordingDto {}
