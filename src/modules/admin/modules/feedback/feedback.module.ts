import { FeedbackJoinQuery } from '@queries/feedback/feedback-join.query';
import { FeedbackQuery } from '@queries/feedback/feedback.query';
import { FeedbackAttachmentQuery } from '@queries/feedback-attachment/feedback-attachment.query';
import { FeedbackReplyQuery } from '@queries/feedback-reply/feedback-reply.query';
import { Module } from '@nestjs/common';
import { StorageModule } from '@modules/storage/storage.module';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { FeedbackAdminController } from '@modules/admin/modules/feedback/controllers/feedback-admin/feedback-admin.controller';
import { FeedbackController } from '@modules/admin/modules/feedback/feedback.controller';
import { FeedbackService } from '@modules/admin/modules/feedback/feedback.service';

@Module({
  imports: [AdminAuthModule, StorageModule, EmailModule],
  controllers: [FeedbackController, FeedbackAdminController],
  providers: [FeedbackService, FeedbackJoinQuery, FeedbackQuery, FeedbackAttachmentQuery, FeedbackReplyQuery],
})
export class FeedbackModule {}
