import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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

export class AdminLoginUserDto {
  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ enum: ['admin'] })
  role: 'admin';
}

export class AdminLoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: AdminLoginUserDto })
  user: AdminLoginUserDto;
}
