import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class SubscriptionCheckoutResultDto {
  @ApiProperty({ description: 'URL de pago en producción' })
  initPoint: string;

  @ApiProperty({ description: 'URL de pago en sandbox' })
  sandboxInitPoint: string;
}

@Trace({ type: 'validation' })
export class SubscriptionCheckoutDto {
  @ApiProperty({ example: 'basic', description: 'ID del plan de suscripción' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
