import { Trace } from '@erixcel/traceflow';
import { DiagnosticDocumentResultDto } from '@modules/admin/modules/diagnostic-document/dto/find-one.dto';

@Trace({ type: 'validation' })
export class DiagnosticDocumentRemoveResultDto extends DiagnosticDocumentResultDto {}
