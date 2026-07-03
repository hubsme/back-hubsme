import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from '@repositories/subscription.repository';
import { SubscriptionPlanRepository } from '@repositories/subscription-plan.repository';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionRepository, SubscriptionPlanRepository],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
