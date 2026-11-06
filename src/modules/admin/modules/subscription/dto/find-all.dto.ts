import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { SubscriptionResultDto } from '@modules/admin/modules/subscription/dto/find-one.dto';

@Trace({ type: 'validation' })
export class SubscriptionListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ enum: ['free', 'basic', 'pro', 'expert'] })
  @IsIn(['free', 'basic', 'pro', 'expert'])
  @IsOptional()
  plan?: 'free' | 'basic' | 'pro' | 'expert';

  @ApiPropertyOptional({ enum: ['active', 'paused', 'cancelled', 'expired'] })
  @IsIn(['active', 'paused', 'cancelled', 'expired'])
  @IsOptional()
  status?: 'active' | 'paused' | 'cancelled' | 'expired';
}

@Trace({ type: 'validation' })
export class SubscriptionListDto {
  @ApiProperty({ type: () => [SubscriptionResultDto] })
  data: SubscriptionResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
