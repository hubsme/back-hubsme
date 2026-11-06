import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@Trace({ type: 'validation' })
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
