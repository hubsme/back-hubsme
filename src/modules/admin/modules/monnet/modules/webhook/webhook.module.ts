import { Module } from '@nestjs/common';
import { CheckoutModule } from '@modules/admin/modules/monnet/modules/checkout/checkout.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [CheckoutModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
