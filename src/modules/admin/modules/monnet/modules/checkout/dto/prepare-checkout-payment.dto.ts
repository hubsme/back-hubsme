import { Trace } from '@erixcel/traceflow';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { PayinCreateQrDto } from '@modules/admin/modules/monnet/modules/payin/dto/create-qr.dto';
import { MonnetCheckoutResultDto } from './create-checkout.dto';

@Trace({ type: 'validation' })
export class MonnetPrepareCheckoutPaymentDto extends PickType(PayinCreateQrDto, [
  'payinCustomerName',
  'payinCustomerLastName',
  'payinCustomerEmail',
  'payinCustomerPhone',
  'payinCustomerTypeDocument',
  'payinCustomerDocument',
] as const) {
  @ApiProperty({ enum: ['DNI'], example: 'DNI' })
  @IsIn(['DNI'])
  declare payinCustomerTypeDocument: string;

  @ApiProperty({
    example: '12345678',
    description:
      'DNI ilustrativo; usar el documento del pagador o el dato de prueba acordado con Monnet.',
  })
  @Matches(/^\d{8}$/)
  declare payinCustomerDocument: string;

  @ApiProperty({ example: 'Avenida de pruebas 123', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  payinCustomerAddress: string;

  @ApiProperty({ example: 'Lima', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  payinCustomerCity: string;

  @ApiProperty({ example: 'Lima', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  payinCustomerRegion: string;

  @ApiProperty({ example: '15073' })
  @IsString()
  @Matches(/^\d{5}$/)
  payinCustomerZipCode: string;
}

@Trace({ type: 'validation' })
export class MonnetPrepareCheckoutPaymentResultDto extends MonnetCheckoutResultDto {}
