import { SubscriptionQuery } from '@queries/subscription/subscription.query';
import { SubscriptionPlanQuery } from '@queries/subscription-plan/subscription-plan.query';
import { Module } from '@nestjs/common';
import { SubscriptionController } from '@modules/admin/modules/subscription/subscription.controller';
import { SubscriptionService } from '@modules/admin/modules/subscription/subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionQuery, SubscriptionPlanQuery],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
