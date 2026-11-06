import { FeedbackAttachmentQuery } from '@queries/feedback-attachment/feedback-attachment.query';
import { FeedbackReplyQuery } from '@queries/feedback-reply/feedback-reply.query';
import { FeedbackJoinQuery } from '@queries/feedback/feedback-join.query';
import { FeedbackQuery } from '@queries/feedback/feedback.query';
import type { UserQuery } from '@queries/user/user.query';

import { Trace } from '@erixcel/traceflow';
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { EmailService } from '@modules/admin/modules/email/email.service';
import {
  FEEDBACK_MAX_IMAGES,
  FEEDBACK_MAX_IMAGE_BYTES,
  hasValidFeedbackImageSignature,
  isAllowedFeedbackImage,
} from '@modules/admin/modules/feedback/config/feedback-upload.config';
import { FeedbackAdminListFiltersDto } from '@modules/admin/modules/feedback/controllers/feedback-admin/dto/find-all.dto';
import { FeedbackStatusUpdateDto } from '@modules/admin/modules/feedback/controllers/feedback-admin/dto/update-status.dto';
import { FeedbackCreateDto } from '@modules/admin/modules/feedback/dto/create.dto';
import { FeedbackListFiltersDto } from '@modules/admin/modules/feedback/dto/find-all.dto';
import { FeedbackReplyCreateDto } from '@modules/admin/modules/feedback/dto/reply.dto';
import { StorageService } from '@modules/storage/storage.service';

// Gestiona las solicitudes de soporte.
@Trace({ name: 'feedback', type: 'service' })
@Injectable()
export class FeedbackService {
  private readonly supportNotificationRecipients = [
    'erick.flores@cymingenieros.pe',
    'clive.nahui@cymingenieros.pe',
  ] as const;

  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly feedbackQuery: FeedbackQuery,
    private readonly feedbackJoinQuery: FeedbackJoinQuery,
    private readonly feedbackAttachmentQuery: FeedbackAttachmentQuery,
    private readonly feedbackReplyQuery: FeedbackReplyQuery,
  ) {}

  async findAllForUser(filters: FeedbackListFiltersDto, user: Awaited<ReturnType<UserQuery['findOne']>>) {
    this.assertSupportedUser(user);
    return this.findAllPaginated(filters, { userId: user.id });
  }

  async findOneForUser(id: number, user: Awaited<ReturnType<UserQuery['findOne']>>) {
    this.assertSupportedUser(user);
    const item = await this.findOneOrFail(id);
    if (item.userId !== user.id) {
      throw new ForbiddenException('No tienes acceso a este comentario de soporte');
    }
    return item;
  }

  findAllForAdmin(filters: FeedbackAdminListFiltersDto) {
    return this.findAllPaginated(filters, {
      search: filters.search,
      userRole: filters.userRole,
    });
  }

  findOneForAdmin(id: number) {
    return this.findOneOrFail(id);
  }

  async create(data: FeedbackCreateDto, files: Express.Multer.File[], user: Awaited<ReturnType<UserQuery['findOne']>>) {
    this.assertSupportedUser(user);
    this.validateFiles(files);

    const title = data.title.trim();
    const description = data.description.trim();
    if (title.length < 3 || description.length < 10) {
      throw new BadRequestException('Completa el título y la descripción del comentario');
    }

    const uploadedFiles: Array<{
      storagePath: string;
      fileUrl: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    }> = [];

    let createdId: number;
    try {
      for (const file of files) {
        const uploaded = await this.storageService.upload(file, `feedback/${user.id}/${randomUUID()}`);
        uploadedFiles.push({
          storagePath: uploaded.publicId,
          fileUrl: uploaded.secureUrl,
          originalName: file.originalname.slice(0, 255),
          mimeType: file.mimetype,
          sizeBytes: file.size,
        });
      }

      const created = await this.createFeedbackRecord(
        {
          userId: user.id,
          userRole: user.role,
          title,
          description,
        },
        uploadedFiles,
      );
      createdId = created.id;
    } catch (error) {
      await this.deleteUploadedFiles(uploadedFiles.map((file) => file.storagePath));
      throw error;
    }

    const result = await this.findOneOrFail(createdId);
    await this.notifySupportTeam(result).catch((error: unknown) => {
      this.logger.error(
        `No se pudo completar la notificación del ticket de soporte ${createdId}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
    return result;
  }

  async replyAsUser(id: number, data: FeedbackReplyCreateDto, user: Awaited<ReturnType<UserQuery['findOne']>>) {
    const item = await this.findOneForUser(id, user);
    this.assertConversationOpen(item.status);
    const message = this.normalizeMessage(data.message);

    await this.createFeedbackReply({
      feedbackId: id,
      authorType: 'user',
      authorUserId: user.id,
      authorName: user.name,
      message,
    });
    return this.findOneOrFail(id);
  }

  async replyAsAdmin(id: number, data: FeedbackReplyCreateDto, adminUsername: string) {
    const item = await this.findOneOrFail(id);
    this.assertConversationOpen(item.status);
    const message = this.normalizeMessage(data.message);

    await this.createFeedbackReply(
      {
        feedbackId: id,
        authorType: 'admin',
        authorUserId: null,
        authorName: adminUsername,
        message,
      },
      item.status === 'new'
        ? {
            status: 'in_review',
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminUsername,
          }
        : undefined,
    );

    return this.findOneOrFail(id);
  }

  async updateStatus(id: number, data: FeedbackStatusUpdateDto, adminUsername: string) {
    await this.findOneOrFail(id);
    await this.feedbackQuery.updateStatus(id, {
      status: data.status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: adminUsername,
    });
    return this.findOneOrFail(id);
  }

  private async findAllPaginated(
    filters: FeedbackListFiltersDto,
    extraFilters: {
      userId?: number;
      search?: string;
      userRole?: 'pyme' | 'consultor';
    },
  ) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters.limit ?? 10));
    const result = await this.feedbackJoinQuery.findAllPaginated(page, limit, {
      ...extraFilters,
      status: filters.status,
    });
    const totalPages = Math.ceil(result.total / limit);

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private async findOneOrFail(id: number) {
    const item = await this.feedbackJoinQuery.findOne(id);
    if (!item) throw new NotFoundException('Comentario de soporte no encontrado');
    return item;
  }

  private assertSupportedUser(
    user: Awaited<ReturnType<UserQuery['findOne']>>,
  ): asserts user is Awaited<ReturnType<UserQuery['findOne']>> & { role: 'pyme' | 'consultor' } {
    if (user.role !== 'pyme' && user.role !== 'consultor') {
      throw new ForbiddenException('Solo las PYMES y consultores pueden usar este módulo');
    }
  }

  private assertConversationOpen(status: string) {
    if (status === 'closed') {
      throw new BadRequestException('Este comentario está cerrado y ya no admite respuestas');
    }
  }

  private normalizeMessage(message: string) {
    const normalized = message.trim();
    if (normalized.length < 2) {
      throw new BadRequestException('Escribe una respuesta antes de enviarla');
    }
    return normalized;
  }

  private validateFiles(files: Express.Multer.File[]) {
    if (files.length > FEEDBACK_MAX_IMAGES) {
      throw new BadRequestException(`Solo puedes adjuntar hasta ${FEEDBACK_MAX_IMAGES} imágenes`);
    }

    for (const file of files) {
      if (!isAllowedFeedbackImage(file.mimetype)) {
        throw new BadRequestException('Solo se permiten imágenes JPG, PNG, WEBP, HEIC o HEIF');
      }
      if (file.size > FEEDBACK_MAX_IMAGE_BYTES) {
        throw new BadRequestException('Cada imagen debe pesar como máximo 8 MB');
      }
      if (!hasValidFeedbackImageSignature(file)) {
        throw new BadRequestException('Uno de los archivos no contiene una imagen válida');
      }
    }
  }

  private async deleteUploadedFiles(storagePaths: string[]) {
    const results = await Promise.allSettled(
      storagePaths.map((storagePath) => this.storageService.delete(storagePath)),
    );
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `No se pudo eliminar el adjunto temporal ${storagePaths[index]}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    });
  }

  private async notifySupportTeam(item: Awaited<ReturnType<FeedbackJoinQuery['findOne']>>) {
    if (!item) return;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.hubsme.net').replace(/\/+$/, '');
    const adminUrl = `${frontendUrl}/backoffice/soporte?feedback=${item.id}`;

    const results = await Promise.allSettled(
      this.supportNotificationRecipients.map((to) =>
        this.emailService.sendSupportFeedbackNotification({
          to,
          feedbackId: item.id,
          title: item.title,
          description: item.description,
          userName: item.userName,
          userEmail: item.userEmail,
          userRole: item.userRole === 'consultor' ? 'consultor' : 'pyme',
          attachmentCount: item.attachmentCount,
          adminUrl,
        }),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `No se pudo enviar la notificación de soporte a ${this.supportNotificationRecipients[index]}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    });
  }

  private async createFeedbackRecord(
    data: Parameters<FeedbackQuery['create']>[0],
    attachments: Array<Omit<Parameters<FeedbackAttachmentQuery['createMany']>[0][number], 'feedbackId'>>,
  ) {
    return this.feedbackQuery.transaction(async () => {
      const created = await this.feedbackQuery.create(data);
      if (attachments.length)
        await this.feedbackAttachmentQuery.createMany(
          attachments.map((attachment) => ({ ...attachment, feedbackId: created.id })),
        );
      return created;
    });
  }
  private async createFeedbackReply(
    data: Parameters<FeedbackReplyQuery['create']>[0],
    statusUpdate?: Pick<Parameters<FeedbackQuery['create']>[0], 'status' | 'statusUpdatedAt' | 'statusUpdatedBy'>,
  ) {
    return this.feedbackQuery.transaction(async () => {
      const now = new Date();
      const reply = await this.feedbackReplyQuery.create(data);
      await this.feedbackQuery.touchAfterReply(data.feedbackId, now, statusUpdate);
      return reply;
    });
  }
}
