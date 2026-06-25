import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MercadoPagoCreateCheckoutDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiPropertyOptional({ example: 60 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ example: 'Sesión de consultoría' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Detalle de la reunión' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CheckoutMeetingDetailsDto {
  @ApiProperty()
  startTime: string;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;
}

export class MercadoPagoCheckoutDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  preferenceId: string | null;

  @ApiProperty({ nullable: true })
  initPoint: string | null;

  @ApiProperty({ nullable: true })
  sandboxInitPoint: string | null;

  @ApiProperty()
  externalReference: string;

  @ApiProperty({ enum: ['created', 'pending', 'approved', 'rejected', 'cancelled', 'expired'] })
  status: 'created' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

  @ApiProperty()
  amount: string;

  @ApiProperty()
  marketplaceFee: string;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ type: CheckoutMeetingDetailsDto, nullable: true })
  meetingDetails?: CheckoutMeetingDetailsDto | null;
}

export class MercadoPagoPaymentWebhookQueryDto {
  @ApiPropertyOptional({ example: 'payment' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'payment' })
  @IsString()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  payment_id?: string;

  @ApiPropertyOptional({ example: '123456789' })
  @IsString()
  @IsOptional()
  'data.id'?: string;

  @ApiPropertyOptional({ example: 'https://api.mercadopago.com/v1/payments/123456789' })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiPropertyOptional({ example: 'payment.created' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ example: 'pending:1:2:1792500000000' })
  @IsString()
  @IsOptional()
  externalReference?: string;
}
