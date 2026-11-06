import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { feedbackAttachment } from '@db/tables/feedback-attachment.table';
import { feedbackReply } from '@db/tables/feedback-reply.table';
import { feedback } from '@db/tables/feedback.table';
import { user } from '@db/tables/user.table';
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class FeedbackJoinQuery {
  @TraceNode({ name: 'feedback.findAllPaginated', type: 'method' })
  async findAllPaginated(
    page: number,
    limit: number,
    filters: {
      userId?: number;
      search?: string;
      status?: (typeof feedback.$inferSelect)['status'];
      userRole?: 'pyme' | 'consultor';
    } = {},
  ) {
    const conditions = [isNull(feedback.deletedAt)];
    const search = filters.search?.trim();
    if (filters.userId) conditions.push(eq(feedback.userId, filters.userId));
    if (filters.status) conditions.push(eq(feedback.status, filters.status));
    if (filters.userRole) conditions.push(eq(feedback.userRole, filters.userRole));
    if (search) {
      conditions.push(
        or(
          ilike(feedback.title, `%${search}%`),
          ilike(feedback.description, `%${search}%`),
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`),
        )!,
      );
    }
    const whereClause = and(...conditions);
    const [{ total }] = await database
      .select({ total: count() })
      .from(feedback)
      .leftJoin(user, eq(feedback.userId, user.id))
      .where(whereClause);
    const data = await database
      .select({
        id: feedback.id,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        userId: feedback.userId,
        userRole: feedback.userRole,
        userName: user.name,
        userEmail: user.email,
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        statusUpdatedAt: feedback.statusUpdatedAt,
        statusUpdatedBy: feedback.statusUpdatedBy,
        attachmentCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${feedbackAttachment}
          WHERE ${feedbackAttachment.feedbackId} = ${feedback.id}
            AND ${feedbackAttachment.deletedAt} IS NULL
        )`,
        replyCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${feedbackReply}
          WHERE ${feedbackReply.feedbackId} = ${feedback.id}
            AND ${feedbackReply.deletedAt} IS NULL
        )`,
      })
      .from(feedback)
      .leftJoin(user, eq(feedback.userId, user.id))
      .where(whereClause)
      .orderBy(desc(feedback.updatedAt), desc(feedback.id))
      .limit(limit)
      .offset((page - 1) * limit);
    return {
      data: data.map((item) => ({
        ...item,
        userName: item.userName ?? 'Usuario',
        userEmail: item.userEmail ?? '',
        attachmentCount: Number(item.attachmentCount),
        replyCount: Number(item.replyCount),
      })),
      total: Number(total),
    };
  }

  @TraceNode({ name: 'feedback.findOne', type: 'method' })
  async findOne(id: number) {
    const result = await database
      .select({
        id: feedback.id,
        createdAt: feedback.createdAt,
        updatedAt: feedback.updatedAt,
        userId: feedback.userId,
        userRole: feedback.userRole,
        userName: user.name,
        userEmail: user.email,
        title: feedback.title,
        description: feedback.description,
        status: feedback.status,
        statusUpdatedAt: feedback.statusUpdatedAt,
        statusUpdatedBy: feedback.statusUpdatedBy,
      })
      .from(feedback)
      .leftJoin(user, eq(feedback.userId, user.id))
      .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)));
    const item = result[0];
    if (!item) return undefined;
    const [attachments, replies] = await Promise.all([
      database
        .select({
          id: feedbackAttachment.id,
          createdAt: feedbackAttachment.createdAt,
          storagePath: feedbackAttachment.storagePath,
          fileUrl: feedbackAttachment.fileUrl,
          originalName: feedbackAttachment.originalName,
          mimeType: feedbackAttachment.mimeType,
          sizeBytes: feedbackAttachment.sizeBytes,
        })
        .from(feedbackAttachment)
        .where(and(eq(feedbackAttachment.feedbackId, id), isNull(feedbackAttachment.deletedAt)))
        .orderBy(asc(feedbackAttachment.createdAt)),
      database
        .select({
          id: feedbackReply.id,
          createdAt: feedbackReply.createdAt,
          authorType: feedbackReply.authorType,
          authorUserId: feedbackReply.authorUserId,
          authorName: feedbackReply.authorName,
          message: feedbackReply.message,
        })
        .from(feedbackReply)
        .where(and(eq(feedbackReply.feedbackId, id), isNull(feedbackReply.deletedAt)))
        .orderBy(asc(feedbackReply.createdAt), asc(feedbackReply.id)),
    ]);
    return {
      ...item,
      userName: item.userName ?? 'Usuario',
      userEmail: item.userEmail ?? '',
      attachmentCount: attachments.length,
      replyCount: replies.length,
      attachments,
      replies,
    };
  }
}
