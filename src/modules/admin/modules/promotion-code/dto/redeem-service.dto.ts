import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@Trace({ type: 'validation' })
export class PromotionCodeRedeemServiceDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  serviceRequestId: number;

  @ApiProperty({ example: 'SERVICIO-GRATIS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code: string;
}

@Trace({ type: 'validation' })
export class PromotionCodeRedeemServiceResultDto {
  @ApiProperty()
  serviceRequestId: number;

  @ApiProperty()
  installmentIndex: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty()
  code: string;

  @ApiProperty({ example: 'Cuota de servicio confirmada con cupón' })
  message: string;
}
