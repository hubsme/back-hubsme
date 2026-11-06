import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

@Trace({ type: 'validation' })
export class MonnetPayinWebhookDto {
  @ApiProperty({
    example: '5',
    description: 'Estado notificado; Hubsme consulta el estado real en Monnet antes de confirmar.',
  })
  @IsString()
  @Matches(/^\d+$/)
  payinStateID: string;

  @ApiPropertyOptional({ example: 'Autorizado' })
  @IsString()
  @IsOptional()
  payinState?: string;

  @ApiProperty({ example: '1646' })
  @IsString()
  @Matches(/^\d+$/)
  payinMerchantID: string;

  @ApiProperty({
    example: '120.00',
    description:
      'Se verifica la firma con la representación recibida, sin redondear ni cambiar decimales.',
  })
  @IsString()
  @Matches(/^\d+(?:\.\d{1,2})?$/)
  payinAmount: string;

  @ApiProperty({ example: 'PEN' })
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  payinCurrency: string;

  @ApiProperty({ example: 'HUBSME-00000000-0000-4000-8000-000000000001' })
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9:_-]+$/)
  payinMerchantOperationNumber: string;

  @ApiProperty({ example: 'QR' })
  @IsString()
  payinMethod: string;

  @ApiProperty({ description: 'SHA-512 hexadecimal calculado por Monnet; no es un JWT.' })
  @IsString()
  @Matches(/^[a-fA-F0-9]{128}$/)
  payinVerification: string;
}

@Trace({ type: 'validation' })
export class MonnetPayinWebhookResultDto {
  @ApiProperty({ example: true }) received: boolean;
}
