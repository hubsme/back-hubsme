import { database, transaction } from '@db/connection.db';
import { feedback } from '@db/tables/feedback.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class FeedbackQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'feedback.updateStatus', type: 'method' })
  async updateStatus(
    id: number,
    data: Pick<typeof feedback.$inferInsert, 'status' | 'statusUpdatedAt' | 'statusUpdatedBy'>,
  ) {
    const result = await database
      .update(feedback)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'feedback.create', type: 'method' })
  async create(data: typeof feedback.$inferInsert) {
    const result = await database.insert(feedback).values(data).returning();
    return result[0];
  }
  @TraceNode({ name: 'feedback.touchAfterReply', type: 'method' })
  async touchAfterReply(
    id: number,
    now: Date,
    statusUpdate: Pick<typeof feedback.$inferInsert, 'status' | 'statusUpdatedAt' | 'statusUpdatedBy'> | undefined,
  ) {
    await database
      .update(feedback)
      .set({ updatedAt: now, ...statusUpdate })
      .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)));
  }
}
