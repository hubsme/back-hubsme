import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { PymeMemberResultDto } from '@modules/admin/modules/pyme/dto/find-one.dto';
import { PymeInvitationResultDto } from '@modules/admin/modules/pyme/dto/create-invitation.dto';

@Trace({ type: 'validation' })
export class PymeTeamResultDto {
  @ApiProperty({ type: () => [PymeMemberResultDto] })
  members: PymeMemberResultDto[];

  @ApiProperty({ type: () => [PymeInvitationResultDto] })
  pendingInvitations: PymeInvitationResultDto[];
}
