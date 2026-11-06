import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CheckoutMeetingDetailsDto } from '@modules/admin/modules/mercado-pago/dto/auth-url.dto';

@Trace({ type: 'validation' })
export class MercadoPagoCreateCheckoutDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: '2026-05-10T15:00:00.000Z' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    type: [String],
    example: ['2026-05-10T15:00:00.000Z', '2026-05-10T16:00:00.000Z', '2026-05-11T15:00:00.000Z'],
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  proposedStartTimes: string[];

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

@Trace({ type: 'validation' })
export class MercadoPagoCheckoutDto {
  @ApiProperty()
  id: number;

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

  @ApiPropertyOptional({ type: () => CheckoutMeetingDetailsDto, nullable: true })
  meetingDetails?: CheckoutMeetingDetailsDto | null;
}
