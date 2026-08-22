import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export type PymeMemberRole = 'owner' | 'member';

export class OrganizationSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiProperty({ enum: ['owner', 'member'] })
  membershipRole: PymeMemberRole;
}

export class PymeMemberResultDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ['owner', 'member'] })
  role: PymeMemberRole;

  @ApiProperty({ enum: ['active', 'suspended'] })
  status: 'active' | 'suspended';

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty()
  isCurrentUser: boolean;
}

export class PymeInvitationResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: ['member'] })
  role: 'member';

  @ApiProperty({ enum: ['pending', 'accepted', 'revoked'] })
  status: 'pending' | 'accepted' | 'revoked';

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}

export class PymeTeamResultDto {
  @ApiProperty({ type: [PymeMemberResultDto] })
  members: PymeMemberResultDto[];

  @ApiProperty({ type: [PymeInvitationResultDto] })
  pendingInvitations: PymeInvitationResultDto[];
}

export class CreatePymeInvitationDto {
  @ApiProperty({ example: 'colaborador@empresa.com' })
  @IsEmail()
  email: string;
}

export class InvitationTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

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

export class MessageResultDto {
  @ApiProperty()
  message: string;
}
