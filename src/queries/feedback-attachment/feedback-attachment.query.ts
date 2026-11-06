import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { feedbackAttachment } from '@db/tables/feedback-attachment.table';

@Injectable()
export class FeedbackAttachmentQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'feedback-attachment.createMany', type: 'method' })
  async createMany(data: (typeof feedbackAttachment.$inferInsert)[]) {
    return database.insert(feedbackAttachment).values(data);
  }
}
