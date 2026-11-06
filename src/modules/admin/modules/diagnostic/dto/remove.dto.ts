import { Trace } from '@erixcel/traceflow';
import { DiagnosticResultDto } from '@modules/admin/modules/diagnostic/dto/find-one.dto';

@Trace({ type: 'validation' })
export class DiagnosticRemoveResultDto extends DiagnosticResultDto {}
