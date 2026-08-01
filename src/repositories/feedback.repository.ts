import { Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { feedbackAttachment, FeedbackAttachmentDTO } from '@db/tables/feedback-attachment.table';
import { feedbackReply, FeedbackReplyDTO } from '@db/tables/feedback-reply.table';
import { feedback, FeedbackDTO, feedbackStatusEnum } from '@db/tables/feedback.table';
import { user } from '@db/tables/user.table';

type FeedbackFilters = {
  userId?: number;
  search?: string;
  status?: (typeof feedbackStatusEnum.enumValues)[number];
  userRole?: 'pyme' | 'consultor';
};

@Injectable()
export class FeedbackRepository {
  async findAllPaginated(page: number, limit: number, filters: FeedbackFilters = {}) {
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

  async create(data: FeedbackDTO, attachments: Array<Omit<FeedbackAttachmentDTO, 'feedbackId'>>) {
    return database.transaction(async (tx) => {
      const result = await tx.insert(feedback).values(data).returning();
      const created = result[0];

      if (attachments.length) {
        await tx.insert(feedbackAttachment).values(
          attachments.map((attachment) => ({
            ...attachment,
            feedbackId: created.id,
          })),
        );
      }

      return created;
    });
  }

  async createReply(
    data: FeedbackReplyDTO,
    statusUpdate?: Pick<FeedbackDTO, 'status' | 'statusUpdatedAt' | 'statusUpdatedBy'>,
  ) {
    return database.transaction(async (tx) => {
      const now = new Date();
      const result = await tx.insert(feedbackReply).values(data).returning();
      await tx
        .update(feedback)
        .set({ updatedAt: now, ...statusUpdate })
        .where(and(eq(feedback.id, data.feedbackId), isNull(feedback.deletedAt)));
      return result[0];
    });
  }

  async updateStatus(id: number, data: Pick<FeedbackDTO, 'status' | 'statusUpdatedAt' | 'statusUpdatedBy'>) {
    const result = await database
      .update(feedback)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)))
      .returning();
    return result[0];
  }
}
