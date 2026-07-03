import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionCheckoutResultDto {
  @ApiProperty({ description: 'URL de pago en producción' })
  initPoint: string;

  @ApiProperty({ description: 'URL de pago en sandbox' })
  sandboxInitPoint: string;
}
