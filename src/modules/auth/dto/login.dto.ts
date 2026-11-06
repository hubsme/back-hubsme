import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { UserResultDto } from '@modules/admin/modules/user/dto/find-one.dto';
import { OrganizationSummaryDto } from '@modules/admin/modules/pyme/dto/find-all.dto';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ type: () => UserResultDto, description: 'User information' })
  user: UserResultDto;

  @ApiProperty({ type: () => OrganizationSummaryDto, nullable: true })
  organization: OrganizationSummaryDto | null;
}

@Trace({ type: 'validation' })
export class LoginDto {
  @ApiProperty({ example: 'miguel.salinas@hubsme.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
