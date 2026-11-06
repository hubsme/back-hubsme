import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PayinCreateBankTransferDto,
  payinBankTransferExample,
  payinTransactionResultExample,
} from '@modules/admin/modules/monnet/modules/payin/dto/create-bank-transfer.dto';

@Trace({ type: 'validation' })
export class PayinCreateYapeWebDto extends PayinCreateBankTransferDto {
  @ApiProperty({
    type: String,
    example: '10.00',
    description:
      'Importe positivo como texto con exactamente dos decimales. Ejemplo: "10.00", con comillas.',
  })
  declare payinAmount: string;

  @ApiPropertyOptional({
    example: 'Web',
    description: 'Este endpoint fija el canal de Yape One Shot a Web.',
  })
  declare payinProductDescription?: string;
}

export const createYapeWebExample = {
  ...payinBankTransferExample,
  payinAmount: '10.00',
  payinProductDescription: 'Web',
};

export const createYapeWebResultExample = {
  ...payinTransactionResultExample,
  flow: 'yape-web',
  scenario: 'valid',
  request: {
    ...payinTransactionResultExample.request,
    payinAmount: '10.00',
    payinMethod: 'Wallet',
    payinCurrency: 'PEN',
    processorCode: 'Yape_one_shot',
    payinProductDescription: 'Web',
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
