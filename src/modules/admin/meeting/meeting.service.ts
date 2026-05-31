import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TaskDTO } from '@db/tables/task.table';
import { MeetingRepository } from '@repositories/meeting.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { TaskRepository } from '@repositories/task.repository';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingFinalizeDto } from './dto/meeting-finalize.dto';
import { MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingTeamsJoinDto } from './dto/meeting-teams-join.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { TeamsMeetingService } from './teams-meeting.service';

@Injectable()
export class MeetingService {
  private readonly logger = new Logger(MeetingService.name);

  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly taskRepository: TaskRepository,
    private readonly matchRepository: PymeConsultantMatchRepository,
    private readonly teamsMeetingService: TeamsMeetingService,
  ) {}

  async findAllPaginated(filters: MeetingListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.meetingRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const meeting = await this.meetingRepository.findOne(id);
    if (!meeting) throw new NotFoundException(`Meeting with ID ${id} not found`);
    return meeting;
  }

  async create(data: MeetingCreateDto) {
    const acceptedMatch = await this.matchRepository.findAcceptedByPair(data.pymeId, data.consultantId);
    if (!acceptedMatch) {
      throw new BadRequestException(['Para solicitar una reunion debe existir un match aceptado']);
    }

    const title = data.title.trim();
    const durationMinutes = data.durationMinutes ?? 60;

    return this.meetingRepository.create({
      ...data,
      title,
      meetingUrl: null,
      description: data.description?.trim(),
      durationMinutes,
      status: 'solicitada',
      requestedBy: data.requestedBy ?? 'pyme',
    });
  }

  async confirm(id: number) {
    const meeting = await this.findOne(id);
    this.logger.log(
      `Confirming meeting ${meeting.id}: status=${meeting.status}, pymeId=${meeting.pymeId}, consultantId=${meeting.consultantId}, startTime=${meeting.startTime.toISOString()}, durationMinutes=${meeting.durationMinutes}`,
    );

    if (meeting.status !== 'solicitada') {
      this.logger.warn(`Meeting ${meeting.id} cannot be confirmed because status is ${meeting.status}`);
      throw new BadRequestException(['Solo se pueden confirmar reuniones solicitadas']);
    }

    const meetingUrl = await this.createTeamsMeetingUrl({
      title: meeting.title,
      startTime: meeting.startTime,
      durationMinutes: meeting.durationMinutes,
    });
    this.logger.log(`Teams meeting URL created for meeting ${meeting.id}`);

    return this.meetingRepository.update(id, {
      status: 'confirmada',
      meetingUrl,
    });
  }

  async createTeamsJoinToken(id: number, data: MeetingTeamsJoinDto) {
    const meeting = await this.findOne(id);
    if (!meeting.meetingUrl?.includes('teams.microsoft.com')) {
      throw new BadRequestException(['La reunion no tiene un enlace de Microsoft Teams']);
    }

    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const duration = meeting.durationMinutes ?? 60;

    // Permitir unirse desde 10 minutos antes del inicio de la reunión
    const allowedStart = new Date(startTime.getTime() - 10 * 60 * 1000);
    // Permitir unirse hasta 30 minutos después del fin de la reunión
    const allowedEnd = new Date(startTime.getTime() + (duration + 30) * 60 * 1000);

    if (now < allowedStart) {
      const allowedStartStr = allowedStart.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      });
      throw new BadRequestException([
        `La reunión aún no está activa. Podrás unirte a partir de las ${allowedStartStr}.`,
      ]);
    }

    if (now > allowedEnd) {
      throw new BadRequestException([
        'Esta reunión ha expirado y ya no está activa.',
      ]);
    }

    return this.teamsMeetingService.createAnonymousJoinToken({
      meetingId: meeting.id,
      meetingUrl: meeting.meetingUrl,
      displayName: data.displayName?.trim() || undefined,
    });
  }

  async getMeetingRecording(id: number) {
    const meeting = await this.findOne(id);
    return this.teamsMeetingService.findMeetingRecordingInOneDrive(meeting.title);
  }

  async update(id: number, data: MeetingUpdateDto) {
    await this.findOne(id);
    if (data.status === 'confirmada') {
      throw new BadRequestException(['Usa el endpoint de confirmacion para aprobar reuniones']);
    }
    if (data.status === 'finalizada') {
      throw new BadRequestException(['Usa el endpoint de finalizacion para cerrar reuniones']);
    }

    return this.meetingRepository.update(id, {
      ...data,
      title: data.title?.trim(),
      description: data.description?.trim(),
    });
  }

  async finalize(id: number, data: MeetingFinalizeDto) {
    const currentMeeting = await this.findOne(id);
    const description = data.description.trim();
    if (!description) {
      throw new BadRequestException(['El contenido del acta es obligatorio']);
    }

    const meeting = await this.meetingRepository.update(id, {
      status: 'finalizada',
      description,
      completedAt: new Date(),
    });

    const tasksPayload: TaskDTO[] = (data.tasks ?? []).map((task) => ({
      meetingId: currentMeeting.id,
      pymeId: currentMeeting.pymeId,
      consultantId: currentMeeting.consultantId,
      title: task.title.trim(),
      description: task.description.trim(),
      assignedTo: task.assignedTo,
      priority: task.priority,
      status: 'pendiente',
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));

    const tasks = await this.taskRepository.createMany(tasksPayload);
    return { meeting, tasks };
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.meetingRepository.delete(id);
  }

  private async createTeamsMeetingUrl(data: {
    title: string;
    startTime: Date;
    durationMinutes: number;
  }): Promise<string> {
    if (!this.teamsMeetingService.isTeamsMeetingCreationEnabled()) {
      throw new BadRequestException([
        'Microsoft Teams no esta habilitado. Configura TEAMS_MEETINGS_ENABLED=true para confirmar reuniones.',
      ]);
    }

    const teamsMeeting = await this.teamsMeetingService.createOnlineMeeting(data);
    return teamsMeeting.joinWebUrl;
  }
}
