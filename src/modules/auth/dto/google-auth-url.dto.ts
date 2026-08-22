import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GoogleAuthUrlDto {
  @ApiPropertyOptional({ enum: ['login', 'register', 'invitation'], default: 'login' })
  @IsIn(['login', 'register', 'invitation'])
  @IsOptional()
  flow?: 'login' | 'register' | 'invitation' = 'login';

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme', required: false })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  role?: 'pyme' | 'consultor';

  @ApiPropertyOptional({ description: 'Token de invitación para unirse a una PYME existente' })
  @IsString()
  @IsOptional()
  invitationToken?: string;
}
