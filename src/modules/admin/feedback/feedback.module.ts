import { Module } from '@nestjs/common';
import { FeedbackRepository } from '@repositories/feedback.repository';
import { StorageModule } from '../../storage/storage.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { EmailModule } from '../email/email.module';
import { FeedbackAdminController } from './feedback-admin.controller';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [AdminAuthModule, StorageModule, EmailModule],
  controllers: [FeedbackController, FeedbackAdminController],
  providers: [FeedbackService, FeedbackRepository],
})
export class FeedbackModule {}
