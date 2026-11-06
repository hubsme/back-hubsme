import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

@Trace({ type: 'validation' })
export class MercadoPagoAuthUrlDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;
}

@Trace({ type: 'validation' })
export class MercadoPagoAuthUrlResponseDto {
  @ApiProperty({ example: 'https://auth.mercadopago.com/authorization?...' })
  url: string;
}

@Trace({ type: 'validation' })
export class CheckoutMeetingDetailsDto {
  @ApiProperty()
  startTime: string;

  @ApiProperty({ type: [String] })
  proposedStartTimes: string[];

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;
}
