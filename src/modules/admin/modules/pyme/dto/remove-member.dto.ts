import { Trace } from '@erixcel/traceflow';
import { MessageResultDto } from '@modules/admin/modules/pyme/dto/revoke-invitation.dto';

@Trace({ type: 'validation' })
export class PymeRemoveMemberResultDto extends MessageResultDto {}
