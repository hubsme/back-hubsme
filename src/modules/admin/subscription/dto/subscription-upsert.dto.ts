import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional } from 'class-validator';

export class SubscriptionUpsertDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiProperty({ enum: ['free', 'basic', 'pro', 'expert'] })
  @IsIn(['free', 'basic', 'pro', 'expert'])
  plan: 'free' | 'basic' | 'pro' | 'expert';

  @ApiPropertyOptional({ enum: ['active', 'paused', 'cancelled', 'expired'], default: 'active' })
  @IsIn(['active', 'paused', 'cancelled', 'expired'])
  @IsOptional()
  status?: 'active' | 'paused' | 'cancelled' | 'expired';

  @ApiPropertyOptional({ example: '2026-06-04T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiresAt?: Date;
}
