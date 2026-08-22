import { ApiProperty } from '@nestjs/swagger';
import { UserResultDto } from '@modules/admin/user/dto/user-result.dto';
import { OrganizationSummaryDto } from '@modules/admin/pyme/dto/pyme-membership.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ type: UserResultDto, description: 'User information' })
  user: UserResultDto;

  @ApiProperty({ type: OrganizationSummaryDto, nullable: true })
  organization: OrganizationSummaryDto | null;
}
