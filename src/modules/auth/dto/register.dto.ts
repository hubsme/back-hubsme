import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'maria@empresa.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'User password, minimum 6 characters' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Maria Torres', description: 'User or business display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme' })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  role?: 'pyme' | 'consultor' = 'pyme';
}
