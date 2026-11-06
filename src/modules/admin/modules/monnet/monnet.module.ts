import { Module } from '@nestjs/common';
import { PayinModule } from '@modules/admin/modules/monnet/modules/payin/payin.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({ imports: [PayinModule, CheckoutModule, WebhookModule] })
export class MonnetModule {}
