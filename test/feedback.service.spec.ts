import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Readable } from 'stream';
import { User } from '@db/tables/user.table';
import { FeedbackRepository } from '@repositories/feedback.repository';
import { EmailService } from '@modules/admin/email/email.service';
import { FeedbackService } from '@modules/admin/feedback/feedback.service';
import { StorageService } from '@modules/storage/storage.service';

type FeedbackDetail = NonNullable<Awaited<ReturnType<FeedbackRepository['findOne']>>>;

describe('FeedbackService', () => {
  let repository: jest.Mocked<FeedbackRepository>;
  let storageService: jest.Mocked<StorageService>;
  let emailService: jest.Mocked<EmailService>;
  let service: FeedbackService;

  const user: User = {
    id: 7,
    createdAt: new Date('2026-07-01T10:00:00Z'),
    updatedAt: new Date('2026-07-01T10:00:00Z'),
    deletedAt: null,
    email: 'pyme@example.com',
    password: 'hashed',
    name: 'Mi Empresa',
    firstName: null,
    lastName: null,
    role: 'pyme',
    authProvider: 'local',
    googleId: null,
    isActive: 'true',
  };

  const detail: FeedbackDetail = {
    id: 12,
    createdAt: new Date('2026-07-31T10:00:00Z'),
    updatedAt: new Date('2026-07-31T10:00:00Z'),
    userId: user.id,
    userRole: 'pyme',
    userName: user.name,
    userEmail: user.email,
    title: 'No puedo descargar el acta',
    description: 'El botón de descarga no responde al hacer clic.',
    status: 'new',
    statusUpdatedAt: null,
    statusUpdatedBy: null,
    attachmentCount: 1,
    replyCount: 0,
    attachments: [],
    replies: [],
  };

  beforeEach(() => {
    repository = {
      findAllPaginated: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      createReply: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<FeedbackRepository>;
    storageService = {
      upload: jest.fn(),
      delete: jest.fn(),
      download: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;
    emailService = {
      sendSupportFeedbackNotification: jest.fn(),
    } as unknown as jest.Mocked<EmailService>;
    service = new FeedbackService(repository, storageService, emailService);
  });

  it('stores screenshots, creates the ticket and notifies both support recipients', async () => {
    const file = jpegFile();
    storageService.upload.mockResolvedValue({
      publicId: 'feedback/7/random/captura.jpg',
      url: 'https://storage.example/captura.jpg',
      secureUrl: 'https://storage.example/captura.jpg',
      format: 'jpg',
      bytes: file.size,
      resourceType: 'image',
      createdAt: new Date().toISOString(),
    });
    repository.create.mockResolvedValue({ id: detail.id } as unknown as Awaited<
      ReturnType<FeedbackRepository['create']>
    >);
    repository.findOne.mockResolvedValue(detail);
    emailService.sendSupportFeedbackNotification.mockResolvedValue({
      message: 'Correo enviado exitosamente',
      messageId: 'mail-1',
    });

    const result = await service.create(
      { title: `  ${detail.title}  `, description: `  ${detail.description}  ` },
      [file],
      user,
    );

    expect(result).toEqual(detail);
    expect(storageService.upload).toHaveBeenCalledTimes(1);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        userRole: 'pyme',
        title: detail.title,
        description: detail.description,
      }),
      [
        expect.objectContaining({
          storagePath: 'feedback/7/random/captura.jpg',
          originalName: 'captura.jpg',
          mimeType: 'image/jpeg',
        }),
      ],
    );
    expect(emailService.sendSupportFeedbackNotification).toHaveBeenCalledTimes(2);
    expect(emailService.sendSupportFeedbackNotification).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'erick.flores@cymingenieros.pe', feedbackId: detail.id }),
    );
    expect(emailService.sendSupportFeedbackNotification).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'clive.nahui@cymingenieros.pe', feedbackId: detail.id }),
    );
  });

  it('removes uploaded blobs when database creation fails', async () => {
    const file = jpegFile();
    storageService.upload.mockResolvedValue({
      publicId: 'feedback/7/random/captura.jpg',
      url: 'https://storage.example/captura.jpg',
      secureUrl: 'https://storage.example/captura.jpg',
      format: 'jpg',
      bytes: file.size,
      resourceType: 'image',
      createdAt: new Date().toISOString(),
    });
    storageService.delete.mockResolvedValue({ succeeded: true });
    repository.create.mockRejectedValue(new Error('database unavailable'));

    await expect(
      service.create({ title: detail.title, description: detail.description }, [file], user),
    ).rejects.toThrow('database unavailable');
    expect(storageService.delete).toHaveBeenCalledWith('feedback/7/random/captura.jpg');
  });

  it('keeps the ticket when the email provider rejects the notifications', async () => {
    repository.create.mockResolvedValue({ id: detail.id } as unknown as Awaited<
      ReturnType<FeedbackRepository['create']>
    >);
    repository.findOne.mockResolvedValue({ ...detail, attachmentCount: 0 });
    emailService.sendSupportFeedbackNotification.mockRejectedValue(new Error('email provider unavailable'));

    const result = await service.create({ title: detail.title, description: detail.description }, [], user);

    expect(result.id).toBe(detail.id);
    expect(emailService.sendSupportFeedbackNotification).toHaveBeenCalledTimes(2);
  });

  it('rejects files whose bytes do not match their image mime type', async () => {
    const invalidFile = jpegFile(Buffer.from('not-an-image'));

    await expect(
      service.create({ title: detail.title, description: detail.description }, [invalidFile], user),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storageService.upload).not.toHaveBeenCalled();
  });

  it('moves a new ticket to in review after the first admin reply', async () => {
    repository.findOne
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce({ ...detail, status: 'in_review', replyCount: 1 });
    repository.createReply.mockResolvedValue({ id: 3 } as unknown as Awaited<
      ReturnType<FeedbackRepository['createReply']>
    >);
    const result = await service.replyAsAdmin(
      detail.id,
      { message: 'Ya estamos revisando lo ocurrido.' },
      'administrador',
    );

    expect(repository.createReply).toHaveBeenCalledWith(
      expect.objectContaining({ authorType: 'admin', authorUserId: null }),
      expect.objectContaining({ status: 'in_review', statusUpdatedBy: 'administrador' }),
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
    expect(result.status).toBe('in_review');
  });

  it('prevents users from reading another user ticket', async () => {
    repository.findOne.mockResolvedValue({ ...detail, userId: 99 });

    await expect(service.findOneForUser(detail.id, user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow replies on closed tickets', async () => {
    repository.findOne.mockResolvedValue({ ...detail, status: 'closed' });

    await expect(service.replyAsUser(detail.id, { message: 'Necesito más ayuda' }, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.createReply).not.toHaveBeenCalled();
  });

  function jpegFile(buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0])): Express.Multer.File {
    return {
      fieldname: 'images',
      originalname: 'captura.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: buffer.length,
      destination: '',
      filename: '',
      path: '',
      buffer,
      stream: Readable.from(buffer),
    };
  }
});
