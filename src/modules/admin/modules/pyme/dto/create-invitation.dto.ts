import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class CreatePymeInvitationDto {
  @ApiProperty({ example: 'colaborador@empresa.com' })
  @IsEmail()
  email: string;
}
