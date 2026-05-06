import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UserCreateDto {
  @ApiProperty({ example: 'consultor@hubsme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'], default: 'pyme' })
  @IsIn(['admin', 'pyme', 'consultor'])
  @IsOptional()
  role?: 'admin' | 'pyme' | 'consultor' = 'pyme';
}
