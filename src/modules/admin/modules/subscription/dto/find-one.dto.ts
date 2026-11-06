import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
export class PaymentResultDto {
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

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true })
  referenceId: string | null;

  @ApiProperty({ nullable: true })
  preferenceId: string | null;

  @ApiProperty({ nullable: true })
  initPoint: string | null;

  @ApiProperty({ nullable: true })
  sandboxInitPoint: string | null;

  @ApiProperty()
  externalReference: string;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  currency: string;
}

@Trace({ type: 'validation' })
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
