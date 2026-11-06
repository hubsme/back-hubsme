import { Injectable } from '@nestjs/common';
import { Trace } from '@erixcel/traceflow';
import { CheckoutService } from '@modules/admin/modules/monnet/modules/checkout/checkout.service';
import { MonnetPayinWebhookDto } from './dto/payin.dto';

@Trace({ name: 'monnet-webhook', type: 'service' })
@Injectable()
export class WebhookService {
  constructor(private readonly checkoutService: CheckoutService) {}

  async payin(body: MonnetPayinWebhookDto) {
    return this.checkoutService.handleNotification(body);
  }
}
