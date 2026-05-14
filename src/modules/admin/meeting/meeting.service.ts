import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MeetingMinutes } from '@db/tables/meeting.table';
import { TaskDTO } from '@db/tables/task.table';
import { MeetingRepository } from '@repositories/meeting.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { TaskRepository } from '@repositories/task.repository';
import { GeminiService } from '@modules/admin/common/gemini.service';
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
    private readonly geminiService: GeminiService,
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
      meetingUrl: data.meetingUrl?.trim(),
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
    });
  }

  async finalize(id: number, data: MeetingFinalizeDto) {
    const currentMeeting = await this.findOne(id);
    const minutes =
      (await this.generateMinutesWithAi(currentMeeting.title, data.description)) ??
      this.buildMinutes(currentMeeting.title, data.description);

    const meeting = await this.meetingRepository.update(id, {
      status: 'finalizada',
      description: data.description.trim(),
      minutes,
      completedAt: new Date(),
    });

    const tasksPayload: TaskDTO[] = minutes.tareasGeneradas.map((item, index) => ({
      meetingId: currentMeeting.id,
      pymeId: currentMeeting.pymeId,
      consultantId: currentMeeting.consultantId,
      title: item.titulo,
      description: item.descripcion,
      assignedTo: item.asignadoA,
      priority: item.prioridad,
      status: 'pendiente',
      dueDate: this.addDays(new Date(), 7 + index * 3),
    }));

    const tasks = await this.taskRepository.createMany(tasksPayload);
    return { meeting, tasks };
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.meetingRepository.delete(id);
  }

  private buildMinutes(title: string, description: string): MeetingMinutes {
    const cleanDescription = description.trim().replace(/\s+/g, ' ');
    const sentences = cleanDescription
      .split(/[.!?]/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 5);

    const points = sentences.length > 0 ? sentences : [cleanDescription];
    const acuerdos = points.slice(0, 3).map((point, index) => ({
      descripcion: point,
      responsable: index % 2 === 0 ? 'consultor' : 'pyme',
      fechaLimite: this.addDays(new Date(), 7 + index * 7).toISOString(),
    }));

    const tareasGeneradas = acuerdos.map((acuerdo, index) => ({
      titulo: this.toTaskTitle(acuerdo.descripcion),
      descripcion: acuerdo.descripcion,
      asignadoA: acuerdo.responsable as 'pyme' | 'consultor',
      prioridad: (index === 0 ? 'alta' : 'media') as 'alta' | 'media',
    }));

    if (tareasGeneradas.length === 0) {
      tareasGeneradas.push({
        titulo: 'Dar seguimiento a acuerdos de la reunion',
        descripcion: cleanDescription,
        asignadoA: 'consultor',
        prioridad: 'media',
      });
    }

    return {
      titulo: `Acta - ${title}`,
      resumen: cleanDescription,
      puntosTratados: points,
      acuerdos,
      tareasGeneradas,
    };
  }

  private generateMinutesWithAi(title: string, description: string): Promise<MeetingMinutes | null> {
    return this.geminiService.generateJson<MeetingMinutes>(`
      Genera un acta formal de reunion para una sesion de consultoria.
      Responde solo JSON valido con camelCase y estos campos:
      {
        "titulo": "string",
        "resumen": "string",
        "puntosTratados": ["string"],
        "acuerdos": [
          { "descripcion": "string", "responsable": "pyme|consultor", "fechaLimite": "YYYY-MM-DD" }
        ],
        "tareasGeneradas": [
          { "titulo": "string", "descripcion": "string", "asignadoA": "pyme|consultor", "prioridad": "alta|media|baja" }
        ]
      }
      TITULO=${title}
      DESCRIPCION=${description}
    `);
  }

  private toTaskTitle(text: string): string {
    const shortText = text.length > 72 ? `${text.slice(0, 69)}...` : text;
    return shortText.charAt(0).toUpperCase() + shortText.slice(1);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
