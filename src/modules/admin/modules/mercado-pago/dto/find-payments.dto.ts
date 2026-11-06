import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { MercadoPagoPaymentHistoryItemDto } from '@modules/admin/modules/mercado-pago/dto/find-payment.dto';

@Trace({ type: 'validation' })
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
    enum: ['cupon', 'mercado_pago', 'tarjeta', 'yape', 'monnet'],
    description: 'Payment method category',
  })
  @IsIn(['cupon', 'mercado_pago', 'tarjeta', 'yape', 'monnet'])
  @IsOptional()
  paymentType?: 'cupon' | 'mercado_pago' | 'tarjeta' | 'yape' | 'monnet';

  @ApiPropertyOptional({ description: 'Maximum of 10 payments per page', default: 10, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  limit?: number = 10;
}

@Trace({ type: 'validation' })
export class MercadoPagoPaymentHistoryResponseDto {
  @ApiProperty({ type: () => [MercadoPagoPaymentHistoryItemDto] })
  data: MercadoPagoPaymentHistoryItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
