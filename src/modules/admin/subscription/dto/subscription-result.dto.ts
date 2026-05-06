import { ApiProperty } from '@nestjs/swagger';

export class PlanResultDto {
  @ApiProperty({ enum: ['free', 'basic', 'pro', 'expert'] })
  id: 'free' | 'basic' | 'pro' | 'expert';

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  features: string[];
}

export class SubscriptionResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: ['free', 'basic', 'pro', 'expert'] })
  plan: 'free' | 'basic' | 'pro' | 'expert';

  @ApiProperty({ enum: ['active', 'paused', 'cancelled', 'expired'] })
  status: 'active' | 'paused' | 'cancelled' | 'expired';

  @ApiProperty()
  startedAt: Date;

  @ApiProperty({ nullable: true })
  expiresAt: Date | null;
}
