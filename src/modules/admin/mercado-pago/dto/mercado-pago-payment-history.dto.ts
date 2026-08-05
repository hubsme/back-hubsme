import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '../../common/pagination.dto';
import { CheckoutMeetingDetailsDto } from './mercado-pago-checkout.dto';

export class MercadoPagoPaymentHistoryFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Year used to filter the payment date', default: new Date().getFullYear() })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @IsOptional()
  year?: number = new Date().getFullYear();

  @ApiPropertyOptional({ description: 'Month used to filter the payment date', default: new Date().getMonth() + 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number = new Date().getMonth() + 1;

  @ApiPropertyOptional({ description: 'Maximum of 10 payments per page', default: 10, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  limit?: number = 10;
}

export class MercadoPagoPaymentHistoryItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  consultantId: number;

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

  @ApiProperty({ nullable: true })
  serviceTitle: string | null;

  @ApiProperty({ nullable: true })
  serviceDescription: string | null;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty({ nullable: true })
  pymeName: string | null;

  @ApiProperty({ nullable: true })
  consultantName: string | null;

  @ApiProperty({ enum: ['payment', 'promotion_code'] })
  paymentMethod: 'payment' | 'promotion_code';

  @ApiProperty({
    description: 'Payment method identifier reported by the payment provider, such as yape, visa or account_money',
    nullable: true,
  })
  paymentMethodId: string | null;

  @ApiProperty({
    description: 'Payment type reported by the payment provider, such as credit_card, debit_card or account_money',
    nullable: true,
  })
  paymentTypeId: string | null;

  @ApiProperty({ nullable: true })
  promotionCode: string | null;
}

export class MercadoPagoPaymentHistoryResponseDto {
  @ApiProperty({ type: [MercadoPagoPaymentHistoryItemDto] })
  data: MercadoPagoPaymentHistoryItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
