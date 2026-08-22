import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { handleDbError } from '@functions/db-error.function';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeMeetingConsultantsFiltersDto } from './dto/pyme-meeting-consultants.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { EmailService } from '../email/email.service';
import { MeetingRepository } from '@repositories/meeting.repository';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { PymeDocumentListFiltersDto } from './dto/pyme-document.dto';
import { formatInPeru } from '@functions/date.function';
import { PymeMembershipRepository } from '@repositories/pyme-membership.repository';
import { UserRepository } from '@repositories/user.repository';
import { AuthenticatedUser } from '@modules/auth/authenticated-user.type';
import { CreatePymeInvitationDto } from './dto/pyme-membership.dto';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class PymeService {
  constructor(
    private readonly pymeRepository: PymeRepository,
    private readonly consultantRepository: ConsultantRepository,
    private readonly whatsappService: WhatsappService,
    private readonly emailService: EmailService,
    private readonly meetingRepository: MeetingRepository,
    private readonly diagnosticRepository: DiagnosticRepository,
    private readonly pymeMembershipRepository: PymeMembershipRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async findAllPaginated(filters: PymeListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.pymeRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const pyme = await this.pymeRepository.findOne(id);
    if (!pyme) throw new NotFoundException(`PYME with ID ${id} not found`);
    return pyme;
  }

  async findOneForUser(currentUser: AuthenticatedUser, id: number) {
    if (currentUser.role === 'pyme' && currentUser.pymeId !== id) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }
    return this.findOne(id);
  }

  async findByUserId(userId: number) {
    const membership = await this.pymeMembershipRepository.findOrganizationByUserId(userId);
    const pyme = membership
      ? await this.pymeRepository.findOne(membership.pymeId)
      : await this.pymeRepository.findByUserId(userId);
    if (!pyme) throw new NotFoundException(`PYME profile for user ID ${userId} not found`);
    return pyme;
  }

  async findByUserForUser(currentUser: AuthenticatedUser, userId: number) {
    const result = await this.findByUserId(userId);
    if (currentUser.role === 'pyme' && currentUser.pymeId !== result.id) {
      throw new ForbiddenException('No tienes acceso a esta empresa');
    }
    return result;
  }

  async findMeetingConsultants(userId: number, filters: PymeMeetingConsultantsFiltersDto) {
    await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.consultantRepository.findByPymeMeetingsPaginated(userId, page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findMeetingDocuments(userId: number, filters: PymeDocumentListFiltersDto) {
    const pyme = await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.meetingRepository.findPymeDocumentsPaginated(
      pyme.id,
      page,
      limit,
      filters.search,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findDiagnosticDocuments(userId: number, filters: PymeDocumentListFiltersDto) {
    const pyme = await this.findByUserId(userId);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.diagnosticRepository.findPymeDocumentsPaginated(
      pyme.id,
      page,
      limit,
      filters.search,
    );
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async create(data: PymeCreateDto) {
    try {
      const { userId, ...rest } = data;
      const cleanData = this.clean(rest);
      return await this.pymeRepository.create({
        id: userId,
        ...cleanData,
      } as any);
    } catch (error) {
      handleDbError(error);
    }
  }

  async createForUser(currentUser: AuthenticatedUser, data: PymeCreateDto) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Solo un administrador puede crear perfiles de empresa manualmente');
    }
    return this.create(data);
  }

  async update(id: number, data: PymeUpdateDto) {
    await this.findOne(id);
    try {
      return await this.pymeRepository.update(id, this.clean(data));
    } catch (error) {
      handleDbError(error);
    }
  }

  async updateForUser(currentUser: AuthenticatedUser, id: number, data: PymeUpdateDto) {
    this.assertOwnerOf(currentUser, id);
    return this.update(id, data);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.pymeRepository.delete(id);
  }

  async deleteForUser(currentUser: AuthenticatedUser, id: number) {
    this.assertOwnerOf(currentUser, id);
    return this.delete(id);
  }

  async findTeam(currentUser: AuthenticatedUser) {
    const pymeId = this.requirePyme(currentUser);
    const members = await this.pymeMembershipRepository.listMembers(pymeId);
    const pendingInvitations =
      currentUser.membershipRole === 'owner' ? await this.pymeMembershipRepository.listPendingInvitations(pymeId) : [];
    return {
      members: members.map((member) => ({ ...member, isCurrentUser: member.userId === currentUser.id })),
      pendingInvitations,
    };
  }

  async createInvitation(currentUser: AuthenticatedUser, data: CreatePymeInvitationDto) {
    const pymeId = this.requireOwner(currentUser);
    const email = data.email.trim().toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      const existingMembership = await this.pymeMembershipRepository.findActiveMembershipByUserId(existingUser.id);
      if (existingMembership?.pymeId === pymeId) {
        throw new BadRequestException(['Este usuario ya pertenece a tu empresa']);
      }
      if (existingMembership) {
        throw new BadRequestException(['Este usuario ya pertenece a otra empresa']);
      }
      if (existingUser.role !== 'pyme') {
        throw new BadRequestException(['El correo pertenece a una cuenta con un perfil incompatible']);
      }
    }

    const pendingInvitation = await this.pymeMembershipRepository.findPendingInvitationByEmail(pymeId, email);
    if (pendingInvitation && pendingInvitation.expiresAt > new Date()) {
      throw new BadRequestException(['Ya existe una invitación pendiente para este correo']);
    }
    if (pendingInvitation) {
      await this.pymeMembershipRepository.revokeInvitation(pendingInvitation.id, pymeId);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.pymeMembershipRepository.createInvitation({
      pymeId,
      email,
      role: 'member',
      tokenHash,
      status: 'pending',
      invitedByUserId: currentUser.id,
      expiresAt,
    });

    const organizationName = currentUser.organization?.name ?? 'tu empresa';
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:6200';
    const invitationUrl = `${frontendUrl}/auth/join?token=${encodeURIComponent(rawToken)}`;
    try {
      await this.emailService.sendEmail({
        to: email,
        subject: `${currentUser.name} te invitó a ${organizationName} en HUBSME`,
        text: `Únete a ${organizationName} en HUBSME desde este enlace: ${invitationUrl}. La invitación vence en 7 días.`,
        html: this.buildInvitationEmail(currentUser.name, organizationName, invitationUrl),
      });
    } catch (error) {
      await this.pymeMembershipRepository.revokeInvitation(invitation.id, pymeId);
      throw error;
    }

    const { tokenHash: _, invitedByUserId: __, deletedAt: ___, updatedAt: ____, pymeId: _____, ...result } = invitation;
    return result;
  }

  async revokeInvitation(currentUser: AuthenticatedUser, invitationId: number) {
    const pymeId = this.requireOwner(currentUser);
    const invitation = await this.pymeMembershipRepository.revokeInvitation(invitationId, pymeId);
    if (!invitation) throw new NotFoundException('Invitación pendiente no encontrada');
    return { message: 'Invitación revocada' };
  }

  async removeMember(currentUser: AuthenticatedUser, userId: number) {
    const pymeId = this.requireOwner(currentUser);
    if (userId === currentUser.id) {
      throw new BadRequestException(['El propietario no puede retirarse de su propia empresa']);
    }
    const member = await this.pymeMembershipRepository.removeMember(pymeId, userId);
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return { message: 'Miembro retirado de la empresa' };
  }

  private requirePyme(currentUser: AuthenticatedUser) {
    if (currentUser.role !== 'pyme' || !currentUser.pymeId) {
      throw new ForbiddenException('No tienes acceso a una organización PYME');
    }
    return currentUser.pymeId;
  }

  private requireOwner(currentUser: AuthenticatedUser) {
    const pymeId = this.requirePyme(currentUser);
    if (currentUser.membershipRole !== 'owner') {
      throw new ForbiddenException('Solo el propietario puede administrar el equipo');
    }
    return pymeId;
  }

  private assertOwnerOf(currentUser: AuthenticatedUser, pymeId: number) {
    if (currentUser.role === 'admin') return;
    if (this.requireOwner(currentUser) !== pymeId) {
      throw new ForbiddenException('No puedes modificar esta empresa');
    }
  }

  private buildInvitationEmail(inviterName: string, organizationName: string, invitationUrl: string) {
    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#3876c7">Te invitaron a colaborar en HUBSME</h2>
        <p><strong>${this.escapeHtml(inviterName)}</strong> te invitó a unirte a <strong>${this.escapeHtml(organizationName)}</strong>.</p>
        <p>Al aceptar podrás consultar los diagnósticos, reuniones, calendario, tareas y documentos compartidos de la empresa.</p>
        <p style="margin:28px 0"><a href="${this.escapeHtml(invitationUrl)}" style="background:#3876c7;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Aceptar invitación</a></p>
        <p style="color:#6b7280;font-size:13px">La invitación vence en 7 días y solo funciona con este correo.</p>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] ?? character,
    );
  }

  private clean<T extends Partial<PymeCreateDto>>(data: T): T {
    return {
      ...data,
      name: data.name?.trim(),
      ruc: data.ruc?.trim(),
      ownerFirstName: data.ownerFirstName?.trim(),
      ownerLastName: data.ownerLastName?.trim(),
      ownerEmail: data.ownerEmail?.trim().toLowerCase(),
      ownerPhone: data.ownerPhone?.trim(),
      ownerPosition: data.ownerPosition?.trim(),
      sector: data.sector?.trim(),
      description: data.description?.trim(),
      logoUrl: data.logoUrl?.trim(),
    };
  }

  async sendMeetingNotification(
    pymeId: number,
    consultantName: string,
    meetingTitle: string,
    startTime: Date,
    durationMinutes: number,
    sessionNotes?: string | null,
  ) {
    try {
      const pyme = await this.pymeRepository.findOne(pymeId);
      if (!pyme) return;

      const dateStr = formatInPeru(startTime, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // 1. WhatsApp notification
      if (pyme.ownerPhone?.trim()) {
        try {
          await this.whatsappService.sendNotificacionPyme(pyme.ownerPhone, {
            to: pyme.ownerPhone,
            nombre_pyme: pyme.ownerFirstName || pyme.name,
            nombre_consultor: consultantName,
            titulo_sesion: meetingTitle,
            fecha_hora: dateStr,
            duracion: `${durationMinutes} minutos`,
          });
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }

      // 2. Email notification
      if (pyme.ownerEmail?.trim()) {
        try {
          await this.emailService.sendMeetingConfirmedEmail({
            to: pyme.ownerEmail,
            recipientName: pyme.ownerFirstName || pyme.name,
            counterpartName: consultantName,
            meetingTitle,
            dateTime: dateStr,
            duration: `${durationMinutes} minutos`,
            sessionNotes,
            recipientType: 'pyme',
          });
        } catch (error) {
          console.error('Error sending email notification:', error);
        }
      }
    } catch {
      // General silent catch to ensure fire-and-forget safety
    }
  }

  async sendMeetingPendingConfirmationNotification(
    pymeId: number,
    consultantName: string,
    meetingTitle: string,
    proposedStartTimes: Date[],
    durationMinutes: number,
    sessionNotes?: string | null,
  ) {
    try {
      const pyme = await this.pymeRepository.findOne(pymeId);
      if (!pyme?.ownerEmail?.trim()) return;

      await this.emailService.sendMeetingPendingConfirmationEmail({
        to: pyme.ownerEmail,
        recipientName: pyme.ownerFirstName || pyme.name,
        counterpartName: consultantName,
        meetingTitle,
        proposedStartTimes: proposedStartTimes.map((startTime) => this.formatProposedStartTime(startTime)),
        duration: `${durationMinutes} minutos`,
        sessionNotes,
        recipientType: 'pyme',
      });
    } catch {
      // General silent catch to ensure fire-and-forget safety
    }
  }

  private formatProposedStartTime(startTime: Date) {
    return formatInPeru(startTime, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
