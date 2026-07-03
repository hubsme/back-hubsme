import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubscriptionCheckoutDto {
  @ApiProperty({ example: 'basic', description: 'ID del plan de suscripción' })
  @IsString()
  @IsNotEmpty()
  planId: string;
}
