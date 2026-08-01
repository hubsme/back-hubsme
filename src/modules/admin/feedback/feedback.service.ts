import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from '@db/tables/user.table';
import { FeedbackRepository } from '@repositories/feedback.repository';
import { EmailService } from '../email/email.service';
import { StorageService } from '../../storage/storage.service';
import { FeedbackCreateDto } from './dto/feedback-create.dto';
import { FeedbackAdminListFiltersDto, FeedbackListFiltersDto } from './dto/feedback-list.dto';
import { FeedbackReplyCreateDto } from './dto/feedback-reply.dto';
import { FeedbackStatusUpdateDto } from './dto/feedback-status.dto';
import {
  FEEDBACK_MAX_IMAGES,
  FEEDBACK_MAX_IMAGE_BYTES,
  hasValidFeedbackImageSignature,
  isAllowedFeedbackImage,
} from './feedback-upload.config';

const SUPPORT_NOTIFICATION_RECIPIENTS = ['erick.flores@cymingenieros.pe', 'clive.nahui@cymingenieros.pe'] as const;

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
  ) {}

  async findAllForUser(filters: FeedbackListFiltersDto, user: User) {
    this.assertSupportedUser(user);
    return this.findAllPaginated(filters, { userId: user.id });
  }

  async findOneForUser(id: number, user: User) {
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

  async create(data: FeedbackCreateDto, files: Express.Multer.File[], user: User) {
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

      const created = await this.feedbackRepository.create(
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

  async replyAsUser(id: number, data: FeedbackReplyCreateDto, user: User) {
    const item = await this.findOneForUser(id, user);
    this.assertConversationOpen(item.status);
    const message = this.normalizeMessage(data.message);

    await this.feedbackRepository.createReply({
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

    await this.feedbackRepository.createReply(
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
    await this.feedbackRepository.updateStatus(id, {
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
    const result = await this.feedbackRepository.findAllPaginated(page, limit, {
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
    const item = await this.feedbackRepository.findOne(id);
    if (!item) throw new NotFoundException('Comentario de soporte no encontrado');
    return item;
  }

  private assertSupportedUser(user: User): asserts user is User & { role: 'pyme' | 'consultor' } {
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

  private async notifySupportTeam(item: Awaited<ReturnType<FeedbackRepository['findOne']>>) {
    if (!item) return;
    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.hubsme.net').replace(/\/+$/, '');
    const adminUrl = `${frontendUrl}/backoffice/soporte?feedback=${item.id}`;

    const results = await Promise.allSettled(
      SUPPORT_NOTIFICATION_RECIPIENTS.map((to) =>
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
          `No se pudo enviar la notificación de soporte a ${SUPPORT_NOTIFICATION_RECIPIENTS[index]}`,
          result.reason instanceof Error ? result.reason.stack : undefined,
        );
      }
    });
  }
}
