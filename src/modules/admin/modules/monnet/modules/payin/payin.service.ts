import { Trace } from '@erixcel/traceflow';
import { DateFunction } from '@functions/date.function';
import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { MonnetPayinWebhookDto } from '@modules/admin/modules/monnet/modules/webhook/dto/payin.dto';
import type { PayinOperation } from './types/payin.type';
import type {
  PayinCreateBankTransferDto,
  PayinTransactionResultDto,
} from '@modules/admin/modules/monnet/modules/payin/dto/create-bank-transfer.dto';
import type {
  PayinConfiguration,
  PayinFlow,
  PayinPayload,
} from '@modules/admin/modules/monnet/modules/payin/types/payin.type';

@Trace({ name: 'monnet-payin', type: 'service' })
@Injectable()
export class PayinService {
  getIdentity() {
    const { environment, merchantId, currency, expirationMinutes } = this.getConfiguration();
    return { environment, merchantId, currency, expirationMinutes };
  }

  verifyNotification(data: MonnetPayinWebhookDto): void {
    const config = this.getConfiguration();
    if (data.payinMerchantID !== config.merchantId || data.payinMethod !== 'QR') {
      throw new UnauthorizedException('Notificación de Monnet inválida');
    }
    const expected = createHash('sha512')
      .update(
        `${data.payinMerchantID}${data.payinMerchantOperationNumber}${data.payinAmount}${data.payinCurrency}${config.key}`,
        'utf8',
      )
      .digest();
    const received = /^[a-fA-F0-9]{128}$/.test(data.payinVerification ?? '')
      ? Buffer.from(data.payinVerification, 'hex')
      : Buffer.alloc(0);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Firma de Monnet inválida');
    }
  }

  async getOperation(reference: string): Promise<PayinOperation | null> {
    const config = this.getConfiguration();
    const statusBaseUrl =
      config.environment === 'cert' ? config.baseUrl : 'https://apiin.monnetpayments.com';
    let upstream: Response;
    let body: unknown;
    try {
      upstream = await fetch(
        `${statusBaseUrl}/ms-experience-payin/merchant/${config.merchantId}/operations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: createHash('sha256')
              .update(`${config.merchantId}${config.key}`)
              .digest('hex'),
          },
          body: JSON.stringify({ payinMerchantOperationNumber: reference }),
          signal: AbortSignal.timeout(config.timeoutMs),
          redirect: 'error',
        },
      );
      body = await upstream.json();
    } catch {
      throw new BadGatewayException('No se pudo verificar el estado del pago en Monnet');
    }
    if (
      !upstream.ok ||
      !body ||
      typeof body !== 'object' ||
      !('payinMerchantID' in body) ||
      String(body.payinMerchantID) !== config.merchantId ||
      !('operations' in body) ||
      !Array.isArray(body.operations)
    ) {
      throw new BadGatewayException('Monnet devolvió una consulta de estado inválida');
    }
    const operations = body.operations.filter(
      (item: unknown): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
    const operation = operations.find((item) => item.payinMerchantOperationNumber === reference);
    if (!operation) return null;
    if (
      !['string', 'number'].includes(typeof operation.payinStateID) ||
      !['string', 'number'].includes(typeof operation.payinAmount) ||
      typeof operation.payinCurrency !== 'string'
    ) {
      throw new BadGatewayException(
        'La operación de Monnet no contiene estado, importe o moneda válidos',
      );
    }
    return {
      payinStateID: String(operation.payinStateID),
      payinAmount: String(operation.payinAmount),
      payinCurrency: operation.payinCurrency,
      payinMerchantOperationNumber: reference,
      ...(operation.payinID != null ? { payinID: String(operation.payinID) } : {}),
    };
  }

  async createTransaction(
    data: PayinCreateBankTransferDto,
    flow: PayinFlow,
  ): Promise<PayinTransactionResultDto> {
    const configuration = this.getConfiguration();
    this.validateAmount(data.payinAmount);
    const payload = this.buildPayload(data, flow, configuration);

    // Se firma el mismo importe, representación y moneda que se enviarán por HTTP.
    const verificationInput = `${configuration.merchantId}${payload.payinMerchantOperationNumber}${payload.payinAmount}${payload.payinCurrency}${configuration.key}`;
    payload.payinVerification = createHash('sha512')
      .update(verificationInput, 'utf8')
      .digest('hex');

    let upstream: Response;
    let body: string;
    try {
      upstream = await fetch(`${configuration.baseUrl}/api-payin/v3/online-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(configuration.timeoutMs),
        redirect: 'error',
      });
      body = await upstream.text();
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException(
          'Monnet no respondió dentro de MONNET_PAYIN_REQUEST_TIMEOUT_MS. No se reintenta automáticamente la creación.',
        );
      }
      throw new BadGatewayException(
        'No se pudo obtener una respuesta de Monnet. No se reintenta automáticamente la creación.',
      );
    }

    const response = this.parseResponse(body);
    const paymentUrl =
      response && typeof response === 'object' && typeof response.url === 'string'
        ? response.url
        : null;
    return {
      environment: configuration.environment,
      flow,
      scenario: 'valid',
      payinMerchantOperationNumber: String(payload.payinMerchantOperationNumber),
      upstreamHttpStatus: upstream.status,
      request: { ...payload, payinVerification: '[redacted]' },
      response,
      paymentUrl,
    };
  }

  private buildPayload(
    data: PayinCreateBankTransferDto,
    flow: PayinFlow,
    configuration: PayinConfiguration,
  ): PayinPayload {
    const address = data.payinCustomerAddress ?? 'Avenida de pruebas 123';
    const city = data.payinCustomerCity ?? 'Lima';
    const region = data.payinCustomerRegion ?? 'Lima';
    const country = data.payinCustomerCountry ?? 'PER';
    const zipCode = data.payinCustomerZipCode ?? '15073';
    const isYape = flow === 'yape-mobile' || flow === 'yape-web';
    const payload: PayinPayload = {
      payinMerchantID: configuration.merchantId,
      payinAmount: data.payinAmount,
      payinCurrency: data.payinCurrency ?? configuration.currency,
      payinMerchantOperationNumber: data.payinMerchantOperationNumber ?? `HUBSME-${randomUUID()}`,
      payinMethod: isYape ? 'Wallet' : flow === 'qr' ? 'QR' : 'BankTransfer',
      payinCustomerName: data.payinCustomerName,
      payinCustomerLastName: data.payinCustomerLastName,
      payinCustomerEmail: data.payinCustomerEmail,
      payinCustomerPhone: data.payinCustomerPhone,
      payinCustomerTypeDocument: data.payinCustomerTypeDocument,
      payinCustomerDocument: data.payinCustomerDocument,
      payinRegularCustomer: data.payinRegularCustomer ?? '',
      payinCustomerID: data.payinCustomerID ?? '',
      payinDiscountCoupon: data.payinDiscountCoupon ?? '',
      payinLanguage: data.payinLanguage ?? 'ES',
      payinExpirationTime: data.payinExpirationTime ?? configuration.expirationMinutes,
      payinDateTime: DateFunction.dateKeyInPeru(),
      payinTransactionOKURL: configuration.successUrl,
      payinTransactionErrorURL: configuration.errorUrl,
      payinFilterBy: data.payinFilterBy ?? '',
      payinCustomerAddress: address,
      payinCustomerCity: city,
      payinCustomerRegion: region,
      payinCustomerCountry: country,
      payinCustomerZipCode: zipCode,
      payinCustomerShippingName:
        data.payinCustomerShippingName ?? `${data.payinCustomerName} ${data.payinCustomerLastName}`,
      payinCustomerShippingPhone: data.payinCustomerShippingPhone ?? data.payinCustomerPhone,
      payinCustomerShippingAddress: data.payinCustomerShippingAddress ?? address,
      payinCustomerShippingCity: data.payinCustomerShippingCity ?? city,
      payinCustomerShippingRegion: data.payinCustomerShippingRegion ?? region,
      payinCustomerShippingCountry: data.payinCustomerShippingCountry ?? country,
      payinCustomerShippingZipCode: data.payinCustomerShippingZipCode ?? zipCode,
      payinProductID: data.payinProductID ?? 'HUBSME-CONSULTORIA',
      // Monnet valida el canal de Yape distinguiendo mayúsculas: Mobile/Web.
      payinProductDescription: isYape
        ? flow === 'yape-mobile'
          ? 'Mobile'
          : 'Web'
        : (data.payinProductDescription ?? 'Sesión de consultoría Hubsme'),
      payinProductAmount: String(data.payinAmount),
      payinProductSku: data.payinProductSku ?? 'CONSULTORIA-60',
      payinProductQuantity: data.payinProductQuantity ?? '1',
      URLMonnet: configuration.urlMonnet,
      typePost: 'json',
    };
    if (isYape) payload.processorCode = 'Yape_one_shot';
    return payload;
  }

  private validateAmount(amount: unknown): void {
    if (
      typeof amount !== 'string' ||
      !/^(?!0\.00$)(?:0|[1-9]\d*)\.\d{2}$/.test(amount) ||
      !Number.isFinite(Number(amount))
    ) {
      throw new BadRequestException(
        'payinAmount debe ser un texto positivo con exactamente dos decimales, por ejemplo "120.00"',
      );
    }
  }

  private parseResponse(body: string): Record<string, unknown> | string | null {
    if (!body.trim()) return null;
    try {
      const value: unknown = JSON.parse(body);
      if (value === null || (typeof value === 'object' && !Array.isArray(value)))
        return value as Record<string, unknown> | null;
    } catch {
      // Conservar respuestas no JSON (por ejemplo un error HTTP del proveedor) para inspección.
    }
    return body;
  }

  private getConfiguration(): PayinConfiguration {
    const environment = process.env.MONNET_PAYIN_ENVIRONMENT?.trim() || 'cert';
    if (environment !== 'cert' && environment !== 'production') {
      throw new ServiceUnavailableException('MONNET_PAYIN_ENVIRONMENT debe ser cert o production');
    }
    const merchantId = process.env.MONNET_PAYIN_MERCHANT_ID?.trim();
    const key = process.env.MONNET_PAYIN_KEY;
    const missing = [
      !merchantId && 'MONNET_PAYIN_MERCHANT_ID',
      !key?.trim() && 'MONNET_PAYIN_KEY',
    ].filter(Boolean);
    if (missing.length)
      throw new ServiceUnavailableException(
        `Completa la configuración de Monnet: ${missing.join(', ')}`,
      );
    if (!/^\d+$/.test(merchantId))
      throw new ServiceUnavailableException('MONNET_PAYIN_MERCHANT_ID debe contener solo dígitos');
    const currency = process.env.MONNET_PAYIN_CURRENCY?.trim() || 'PEN';
    if (currency !== 'PEN' && currency !== 'USD')
      throw new ServiceUnavailableException('MONNET_PAYIN_CURRENCY debe ser PEN o USD');
    const expirationMinutes = Number(process.env.MONNET_PAYIN_EXPIRATION_MINUTES || '30');
    const timeoutMs = Number(process.env.MONNET_PAYIN_REQUEST_TIMEOUT_MS || '15000');
    if (!Number.isSafeInteger(expirationMinutes) || expirationMinutes < 1)
      throw new ServiceUnavailableException(
        'MONNET_PAYIN_EXPIRATION_MINUTES debe ser un entero positivo',
      );
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120000)
      throw new ServiceUnavailableException(
        'MONNET_PAYIN_REQUEST_TIMEOUT_MS debe estar entre 1 y 120000',
      );
    const baseUrl =
      environment === 'cert'
        ? 'https://cert.monnetpayments.com'
        : 'https://payin.api.monnetpayments.com';
    return {
      environment,
      baseUrl,
      merchantId,
      key,
      currency,
      expirationMinutes,
      timeoutMs,
      urlMonnet: `${baseUrl}/api-payin/v1/online-payments`,
      successUrl: this.readHttpsUrl('MONNET_PAYIN_SUCCESS_URL'),
      errorUrl: this.readHttpsUrl('MONNET_PAYIN_ERROR_URL'),
    };
  }

  private readHttpsUrl(name: string): string {
    const value = process.env[name]?.trim();
    try {
      if (value && value.length <= 250 && new URL(value).protocol === 'https:') return value;
    } catch {
      // El mensaje identifica la variable que debe completar el integrador, sin exponer secretos.
    }
    throw new ServiceUnavailableException(
      `${name} debe contener una URL HTTPS válida de hasta 250 caracteres`,
    );
  }
}
