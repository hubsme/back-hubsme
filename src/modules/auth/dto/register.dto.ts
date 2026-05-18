import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

  @ApiProperty({ example: 'Textiles del Sur SAC', description: 'User or business display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Maria', description: 'Consultant first name or PYME owner first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Torres', description: 'Consultant last name or PYME owner last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '20600000001', description: 'PYME RUC' })
  @IsString()
  @IsOptional()
  ruc?: string;

  @ApiPropertyOptional({ example: '+51999888777', description: 'PYME owner phone' })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ example: 'Gerente general', description: 'PYME owner position' })
  @IsString()
  @IsOptional()
  ownerPosition?: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme' })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  role?: 'pyme' | 'consultor' = 'pyme';
}
