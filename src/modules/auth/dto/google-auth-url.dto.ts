import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class GoogleAuthUrlDto {
  @ApiPropertyOptional({ enum: ['login', 'register'], default: 'login' })
  @IsIn(['login', 'register'])
  @IsOptional()
  flow?: 'login' | 'register' = 'login';

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme', required: false })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  role?: 'pyme' | 'consultor';
}
