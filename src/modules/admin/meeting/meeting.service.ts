import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TaskDTO } from '@db/tables/task.table';
import { MeetingRepository } from '@repositories/meeting.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { TaskRepository } from '@repositories/task.repository';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingFinalizeDto } from './dto/meeting-finalize.dto';
import { MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';

@Injectable()
export class MeetingService {
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly taskRepository: TaskRepository,
    private readonly matchRepository: PymeConsultantMatchRepository,
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

    return this.meetingRepository.create({
      ...data,
      title: data.title.trim(),
      meetingUrl: data.meetingUrl?.trim() || this.generateMeetingUrl(),
      description: data.description?.trim(),
      durationMinutes: data.durationMinutes ?? 60,
      status: data.status ?? 'solicitada',
    });
  }

  async update(id: number, data: MeetingUpdateDto) {
    await this.findOne(id);
    return this.meetingRepository.update(id, {
      ...data,
      title: data.title?.trim(),
      meetingUrl: data.meetingUrl?.trim(),
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

  private generateMeetingUrl(): string {
    return `https://meet.hubsme.app/room/${randomUUID()}`;
  }
}
