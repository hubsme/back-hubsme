import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckoutMeetingDetailsDto } from '@modules/admin/modules/mercado-pago/dto/auth-url.dto';

@Trace({ type: 'validation' })
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

  @ApiPropertyOptional({ type: () => CheckoutMeetingDetailsDto, nullable: true })
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

  @ApiProperty({ type: String, nullable: true, description: 'Identificador de la operación en el proveedor de pago.' })
  paymentId: string | null;

  @ApiProperty({ enum: ['monnet', 'mercado_pago'], nullable: true })
  paymentProvider: 'monnet' | 'mercado_pago' | null;

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
