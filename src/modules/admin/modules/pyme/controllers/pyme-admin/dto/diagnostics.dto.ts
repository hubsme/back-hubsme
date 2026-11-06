import { Trace } from '@erixcel/traceflow';
import { DiagnosticListDto } from '@modules/admin/modules/diagnostic/dto/find-all.dto';

@Trace({ type: 'validation' })
export class PymeAdminDiagnosticsResultDto extends DiagnosticListDto {}
