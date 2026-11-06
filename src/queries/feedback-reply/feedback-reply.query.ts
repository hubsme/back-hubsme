import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { feedbackReply } from '@db/tables/feedback-reply.table';

@Injectable()
export class FeedbackReplyQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'feedback-reply.create', type: 'method' })
  async create(data: typeof feedbackReply.$inferInsert) {
    const result = await database.insert(feedbackReply).values(data).returning();
    return result[0];
  }
}
