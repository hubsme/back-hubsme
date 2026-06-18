import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class MercadoPagoAuthUrlDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;
}

export class MercadoPagoAuthUrlResponseDto {
  @ApiProperty({ example: 'https://auth.mercadopago.com/authorization?...' })
  url: string;
}

export class MercadoPagoCallbackDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  error?: string;
}
