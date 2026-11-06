import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import {
  PayinCreateBankTransferDto,
  payinBankTransferExample,
  payinTransactionResultExample,
} from '@modules/admin/modules/monnet/modules/payin/dto/create-bank-transfer.dto';

@Trace({ type: 'validation' })
export class PayinCreateQrDto extends PayinCreateBankTransferDto {
  @ApiProperty({
    type: String,
    example: '49.85',
    description:
      'Importe positivo como texto con exactamente dos decimales. Ejemplo: "49.85", con comillas.',
  })
  declare payinAmount: string;
}

export const createQrExample = { ...payinBankTransferExample, payinAmount: '49.85' };

export const createQrResultExample = {
  ...payinTransactionResultExample,
  flow: 'qr',
  scenario: 'valid',
  request: {
    ...payinTransactionResultExample.request,
    payinAmount: '49.85',
    payinMethod: 'QR',
    payinCurrency: 'PEN',
  },
  response: {
    url: 'https://cert.monnetpayments.com/checkout/example',
    payinErrorCode: '0000',
    payinErrorMessage: 'Successfull process',
    payinTrxOperation: 'MONTRX-EXAMPLE',
    experienceVoucher: {
      status: 'PENDIENTE_PAGO',
      amount: '49.85',
      currencyCode: 'PEN',
      qrCode: 'data:image/png;base64,...',
      generalInstructions: [],
    },
  },
  paymentUrl: 'https://cert.monnetpayments.com/checkout/example',
};
