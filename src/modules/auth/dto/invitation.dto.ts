import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
export class InvitationPreviewDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  organizationName: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  hasAccount: boolean;
}
