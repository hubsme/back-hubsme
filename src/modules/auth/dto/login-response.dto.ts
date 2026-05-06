import { ApiProperty } from '@nestjs/swagger';
import { UserResultDto } from '@modules/admin/user/dto/user-result.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ type: UserResultDto, description: 'User information' })
  user: UserResultDto;
}
