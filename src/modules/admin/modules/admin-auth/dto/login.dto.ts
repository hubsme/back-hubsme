import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '********' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

@Trace({ type: 'validation' })
export class AdminLoginUserDto {
  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ enum: ['admin'] })
  role: 'admin';
}

@Trace({ type: 'validation' })
export class AdminLoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: () => AdminLoginUserDto })
  user: AdminLoginUserDto;
}
