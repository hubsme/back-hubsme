import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
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

  @ApiPropertyOptional({ enum: ['servicio', 'consultoria'], description: 'Type of operation' })
  @IsIn(['servicio', 'consultoria'])
  @IsOptional()
  operationType?: 'servicio' | 'consultoria';

  @ApiPropertyOptional({
    enum: ['cupon', 'mercado_pago', 'tarjeta', 'yape'],
    description: 'Payment method category',
  })
  @IsIn(['cupon', 'mercado_pago', 'tarjeta', 'yape'])
  @IsOptional()
  paymentType?: 'cupon' | 'mercado_pago' | 'tarjeta' | 'yape';

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

  @ApiProperty({ nullable: true, type: Date })
  meetingCreatedAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  meetingStartTime: Date | null;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty({ nullable: true })
  serviceInstallmentIndex: number | null;

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

  @ApiProperty({
    enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'],
    nullable: true,
  })
  meetingStatus: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada' | null;

  @ApiProperty({ nullable: true })
  meetingCancellationReason: string | null;

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
