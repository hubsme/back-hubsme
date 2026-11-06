import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export const payinBankTransferExample = {
  payinAmount: '120.00',
  payinCurrency: 'PEN',
  payinCustomerName: 'Erick',
  payinCustomerLastName: 'Flores Santos',
  payinCustomerEmail: 'xerickcua@gmail.com',
  payinCustomerPhone: '929073820',
  payinCustomerShippingName: 'Erick Flores Santos',
  payinCustomerShippingPhone: '929073820',
  payinCustomerTypeDocument: 'DNI',
  payinCustomerDocument: '12345678',
  payinProductDescription: 'Sesión de consultoría Hubsme',
  payinExpirationTime: 30,
};

@Trace({ type: 'validation' })
export class PayinCreateBankTransferDto {
  @ApiProperty({
    type: String,
    description:
      'Importe positivo como texto con exactamente dos decimales. Ejemplo: "120.00", con comillas.',
    pattern: '^(?!0\\.00$)(?:0|[1-9]\\d*)\\.\\d{2}$',
    example: '120.00',
  })
  // Conservar el tipo JSON original pese a enableImplicitConversion del ValidationPipe.
  @Transform(({ obj, key }) => (obj as Record<string, unknown>)[key], { toClassOnly: true })
  @IsString({ message: 'payinAmount debe enviarse como texto, por ejemplo "120.00"' })
  @Matches(/^(?!0\.00$)(?:0|[1-9]\d*)\.\d{2}$/, {
    message:
      'payinAmount debe ser positivo y tener exactamente dos decimales, por ejemplo "120.00"',
  })
  payinAmount: string;

  @ApiPropertyOptional({
    enum: ['PEN', 'USD'],
    example: 'PEN',
    description: 'Si se omite, usa MONNET_PAYIN_CURRENCY.',
  })
  @IsIn(['PEN', 'USD'])
  @IsOptional()
  payinCurrency?: 'PEN' | 'USD';

  @ApiPropertyOptional({
    maxLength: 50,
    nullable: true,
    example: null,
    description:
      'Referencia única del comercio. Omitir o enviar null para generar HUBSME-<UUID> en cada llamada y repetir el ejemplo sin duplicar referencias.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9:_-]+$/)
  @MaxLength(50)
  @IsOptional()
  payinMerchantOperationNumber?: string;

  @ApiProperty({ example: 'Erick', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  payinCustomerName: string;

  @ApiProperty({ example: 'Flores Santos', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  payinCustomerLastName: string;

  @ApiProperty({ example: 'xerickcua@gmail.com', maxLength: 50 })
  @IsEmail()
  @MaxLength(50)
  payinCustomerEmail: string;

  @ApiProperty({
    example: '929073820',
    description: 'Celular peruano del cliente: nueve dígitos, sin el prefijo +51.',
  })
  @IsString()
  @Matches(/^\d{9}$/)
  payinCustomerPhone: string;

  @ApiProperty({
    example: 'DNI',
    description: 'Tipo de documento habilitado por Monnet para el comercio.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  payinCustomerTypeDocument: string;

  @ApiProperty({
    example: '12345678',
    description:
      'Documento ilustrativo; reemplazar por los datos de certificación acordados con Monnet.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  payinCustomerDocument: string;

  @ApiPropertyOptional({
    example: 30,
    minimum: 1,
    description: 'Minutos de vigencia. Si se omite, usa MONNET_PAYIN_EXPIRATION_MINUTES.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  payinExpirationTime?: number;

  @ApiPropertyOptional({ example: 'ES', default: 'ES' })
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  @IsOptional()
  payinLanguage?: string;

  @ApiPropertyOptional({
    example: 'Sesión de consultoría Hubsme',
    description: 'Yape One Shot fija este campo a Mobile o Web según el endpoint.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  @IsOptional()
  payinProductDescription?: string;

  @ApiPropertyOptional({ example: 'HUBSME-CONSULTORIA', default: 'HUBSME-CONSULTORIA' })
  @IsString()
  @IsOptional()
  payinProductID?: string;

  @ApiPropertyOptional({ example: 'CONSULTORIA-60', default: 'CONSULTORIA-60' })
  @IsString()
  @IsOptional()
  payinProductSku?: string;

  @ApiPropertyOptional({ example: '1', default: '1' })
  @IsString()
  @Matches(/^[1-9]\d*$/)
  @IsOptional()
  payinProductQuantity?: string;

  @ApiPropertyOptional({ example: 'Avenida de pruebas 123', default: 'Avenida de pruebas 123' })
  @IsString()
  @IsOptional()
  payinCustomerAddress?: string;

  @ApiPropertyOptional({ example: 'Lima', default: 'Lima' })
  @IsString()
  @IsOptional()
  payinCustomerCity?: string;

  @ApiPropertyOptional({ example: 'Lima', default: 'Lima' })
  @IsString()
  @IsOptional()
  payinCustomerRegion?: string;

  @ApiPropertyOptional({
    example: 'PER',
    default: 'PER',
    description: 'Código/valor requerido por la configuración de tu comercio en Monnet.',
  })
  @IsString()
  @IsOptional()
  payinCustomerCountry?: string;

  @ApiPropertyOptional({ example: '15073', default: '15073' })
  @IsString()
  @IsOptional()
  payinCustomerZipCode?: string;

  @ApiPropertyOptional({ example: '', default: '' })
  @IsString()
  @IsOptional()
  payinRegularCustomer?: string;

  @ApiPropertyOptional({ example: '', default: '' })
  @IsString()
  @IsOptional()
  payinCustomerID?: string;

  @ApiPropertyOptional({ example: '', default: '' })
  @IsString()
  @IsOptional()
  payinDiscountCoupon?: string;

  @ApiPropertyOptional({ example: '', default: '' })
  @IsString()
  @IsOptional()
  payinFilterBy?: string;

  @ApiPropertyOptional({
    example: 'Erick Flores Santos',
    description: 'Si se omite, usa el nombre y apellido del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingName?: string;

  @ApiPropertyOptional({
    example: '929073820',
    description: 'Si se omite, usa el teléfono del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingPhone?: string;

  @ApiPropertyOptional({
    example: 'Avenida de pruebas 123',
    description: 'Si se omite, usa la dirección del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingAddress?: string;

  @ApiPropertyOptional({
    example: 'Lima',
    description: 'Si se omite, usa la ciudad del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingCity?: string;

  @ApiPropertyOptional({
    example: 'Lima',
    description: 'Si se omite, usa la región del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingRegion?: string;

  @ApiPropertyOptional({ example: 'PER', description: 'Si se omite, usa el país del comprador.' })
  @IsString()
  @IsOptional()
  payinCustomerShippingCountry?: string;

  @ApiPropertyOptional({
    example: '15073',
    description: 'Si se omite, usa el código postal del comprador.',
  })
  @IsString()
  @IsOptional()
  payinCustomerShippingZipCode?: string;
}

@Trace({ type: 'validation' })
export class PayinTransactionResultDto {
  @ApiProperty({ enum: ['cert', 'production'], example: 'cert' })
  environment: 'cert' | 'production';

  @ApiProperty({ example: 'bank-transfer' })
  flow: string;

  @ApiProperty({ example: 'valid' })
  scenario: string;

  @ApiProperty({ example: 'HUBSME-00000000-0000-4000-8000-000000000001' })
  payinMerchantOperationNumber: string;

  @ApiProperty({
    example: 200,
    description:
      'HTTP recibido de Monnet. El HTTP 200 de Hubsme solo indica que se recibió una respuesta; revisar este campo y response.payinErrorCode. Crear la operación no confirma el pago.',
  })
  upstreamHttpStatus: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'JSON efectivamente enviado a Monnet, con payinVerification oculto. Permite comparar importe, tipo JSON, método y canal de cada operación.',
  })
  request: Record<string, unknown>;

  @ApiProperty({
    nullable: true,
    oneOf: [{ type: 'object', additionalProperties: true }, { type: 'string' }],
    description:
      'Respuesta original de Monnet. Puede incluir url, payinErrorCode, payinErrorMessage, payinTrxOperation, experienceVoucher (instrucciones/QR) o deepLinks (Yape). Se conserva sin atribuirle un pago aprobado.',
    example: {
      url: 'https://cert.monnetpayments.com/checkout/example',
      payinErrorCode: '0000',
      payinErrorMessage: 'Successfull process',
      payinTrxOperation: 'MONTRX-EXAMPLE',
    },
  })
  response: Record<string, unknown> | string | null;

  @ApiProperty({
    nullable: true,
    example: 'https://cert.monnetpayments.com/checkout/example',
    description:
      'response.url cuando Monnet lo proporciona. Abrir esta URL para ver la experiencia de pago. El enlace del ejemplo es ilustrativo.',
  })
  paymentUrl: string | null;
}

export const payinTransactionResultExample = {
  environment: 'cert',
  flow: 'bank-transfer',
  scenario: 'valid',
  payinMerchantOperationNumber: 'HUBSME-00000000-0000-4000-8000-000000000001',
  upstreamHttpStatus: 200,
  request: { payinAmount: '120.00', payinMethod: 'BankTransfer', payinVerification: '[redacted]' },
  response: {
    url: 'https://cert.monnetpayments.com/checkout/example',
    payinErrorCode: '0000',
    payinErrorMessage: 'Successfull process',
    payinTrxOperation: 'MONTRX-EXAMPLE',
  },
  paymentUrl: 'https://cert.monnetpayments.com/checkout/example',
};
