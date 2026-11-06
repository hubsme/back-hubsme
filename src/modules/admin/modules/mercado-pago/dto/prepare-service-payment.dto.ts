import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

@Trace({ type: 'validation' })
export class MercadoPagoServicePaymentDto {
  @ApiPropertyOptional({
    example: 0,
    minimum: 0,
    description: 'Índice de la cuota que se desea pagar. Si se omite, se usa la primera pendiente.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  installmentIndex?: number;
}
