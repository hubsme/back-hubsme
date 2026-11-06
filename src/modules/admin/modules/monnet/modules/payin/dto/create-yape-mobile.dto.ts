import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PayinCreateBankTransferDto,
  payinBankTransferExample,
  payinTransactionResultExample,
} from '@modules/admin/modules/monnet/modules/payin/dto/create-bank-transfer.dto';

@Trace({ type: 'validation' })
export class PayinCreateYapeMobileDto extends PayinCreateBankTransferDto {
  @ApiProperty({
    type: String,
    example: '10.00',
    description:
      'Importe positivo como texto con exactamente dos decimales. Ejemplo: "10.00", con comillas.',
  })
  declare payinAmount: string;

  @ApiPropertyOptional({
    example: 'Mobile',
    description: 'Este endpoint fija el canal de Yape One Shot a Mobile.',
  })
  declare payinProductDescription?: string;
}

export const createYapeMobileExample = {
  ...payinBankTransferExample,
  payinAmount: '10.00',
  payinProductDescription: 'Mobile',
};

export const createYapeMobileResultExample = {
  ...payinTransactionResultExample,
  flow: 'yape-mobile',
  scenario: 'valid',
  request: {
    ...payinTransactionResultExample.request,
    payinAmount: '10.00',
    payinMethod: 'Wallet',
    payinCurrency: 'PEN',
    processorCode: 'Yape_one_shot',
    payinProductDescription: 'Mobile',
  },
  response: {
    payinErrorCode: '0000',
    payinErrorMessage: 'Successfull process',
    payinTrxOperation: 'MONTRX-EXAMPLE',
    deepLinks: [
      {
        processor: 'YapeOS',
        processoCode: 'Yape_one_shot',
        deepLink: 'https://www.yape.com.pe/app/checkout/oneshot/example',
        order: 1,
      },
    ],
  },
  paymentUrl: null,
};
