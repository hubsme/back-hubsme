import { Trace } from '@erixcel/traceflow';
import { LoginResponseDto } from '@modules/auth/dto/login.dto';

@Trace({ type: 'validation' })
export class AuthAcceptInvitationResultDto extends LoginResponseDto {}
