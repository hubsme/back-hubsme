import { Trace } from '@erixcel/traceflow';
import { ConsultantGoogleCalendarStatusDto } from '@modules/admin/modules/consultant-google-calendar/dto/status.dto';

@Trace({ type: 'validation' })
export class ConsultantGoogleCalendarDisconnectResultDto extends ConsultantGoogleCalendarStatusDto {}
