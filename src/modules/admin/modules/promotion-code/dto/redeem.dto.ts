import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

@Trace({ type: 'validation' })
export class PromotionCodeRedemptionDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty({ nullable: true })
  serviceInstallmentIndex: number | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty()
  redeemedAt: Date;
}

@Trace({ type: 'validation' })
export class PromotionCodeRedeemDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  checkoutId: number;

  @ApiProperty({ example: 'GRATIS-JULIO' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code: string;
}

@Trace({ type: 'validation' })
export class PromotionCodeRedeemResultDto {
  @ApiProperty()
  meetingId: number;

  @ApiProperty()
  checkoutId: number;

  @ApiProperty()
  code: string;

  @ApiProperty({ example: 'Consultoria gratuita confirmada' })
  message: string;
}
