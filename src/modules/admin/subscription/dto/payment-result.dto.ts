import { ApiProperty } from '@nestjs/swagger';

export class PaymentResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  type: string;

  @ApiProperty({ nullable: true })
  referenceId: string | null;

  @ApiProperty({ nullable: true })
  preferenceId: string | null;

  @ApiProperty({ nullable: true })
  initPoint: string | null;

  @ApiProperty({ nullable: true })
  sandboxInitPoint: string | null;

  @ApiProperty()
  externalReference: string;

  @ApiProperty({ nullable: true })
  mercadoPagoPaymentId: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  currency: string;
}
