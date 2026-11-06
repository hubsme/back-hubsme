import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { checkoutStatusEnum } from '@db/tables/checkout.table';

@Trace({ type: 'validation' })
export class MonnetCreateCheckoutDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  consultantId: number;

  @ApiPropertyOptional({ example: '2026-12-10T15:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({
    type: [String],
    example: ['2026-12-10T15:00:00.000Z', '2026-12-11T15:00:00.000Z', '2026-12-12T15:00:00.000Z'],
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsDateString({}, { each: true })
  proposedStartTimes: string[];

  @ApiPropertyOptional({ example: 60, minimum: 60, maximum: 480 })
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(480)
  @IsOptional()
  durationMinutes?: number;

  @ApiProperty({ example: 'Sesión de consultoría', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Revisión del plan comercial', maxLength: 2000 })
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;
}

@Trace({ type: 'validation' })
export class MonnetCheckoutMeetingDetailsDto {
  @ApiProperty() startTime: string;
  @ApiProperty({ type: [String] }) proposedStartTimes: string[];
  @ApiProperty() durationMinutes: number;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description?: string;
}

@Trace({ type: 'validation' })
export class MonnetCheckoutResultDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: Number, nullable: true }) meetingId: number | null;
  @ApiProperty() pymeId: number;
  @ApiProperty() consultantId: number;
  @ApiProperty({ enum: checkoutStatusEnum.enumValues })
  status: (typeof checkoutStatusEnum.enumValues)[number];
  @ApiProperty({ example: '120.00' }) amount: string;
  @ApiProperty() marketplaceFee: string;
  @ApiProperty({ example: 'PEN' }) currency: string;
  @ApiProperty({ type: () => MonnetCheckoutMeetingDetailsDto, nullable: true })
  meetingDetails: MonnetCheckoutMeetingDetailsDto | null;
  @ApiProperty({ type: String, nullable: true }) paymentUrl: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Imagen PNG del QR en formato data:image/png;base64,...',
  })
  qrCode: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Vencimiento en ISO 8601; se muestra en la zona horaria del usuario.',
  })
  expiresAt: string | null;
  @ApiProperty({ enum: ['cert', 'production'], nullable: true }) environment:
    | 'cert'
    | 'production'
    | null;
  @ApiProperty({
    description:
      'Indica si se puede generar un QR nuevo. Un intento incierto se verifica antes de volver a cobrar.',
  })
  canCreatePayment: boolean;
}
