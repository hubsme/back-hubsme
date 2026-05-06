import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export class DashboardFilterDto {
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ enum: ['admin', 'pyme', 'consultor'] })
  @IsIn(['admin', 'pyme', 'consultor'])
  @IsOptional()
  role?: 'admin' | 'pyme' | 'consultor';
}
