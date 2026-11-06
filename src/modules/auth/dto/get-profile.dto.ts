import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { UserResultDto } from '@modules/admin/modules/user/dto/find-one.dto';
import { OrganizationSummaryDto } from '@modules/admin/modules/pyme/dto/find-all.dto';

@Trace({ type: 'validation' })
export class AuthProfileResultDto extends UserResultDto {
  @ApiProperty({ nullable: true, type: Number })
  pymeId: number | null;

  @ApiProperty({ nullable: true, enum: ['owner', 'member'] })
  membershipRole: 'owner' | 'member' | null;

  @ApiProperty({ nullable: true, type: () => OrganizationSummaryDto })
  organization: OrganizationSummaryDto | null;
}
