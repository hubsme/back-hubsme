import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from '@repositories/task.repository';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskListFiltersDto } from './dto/task-list.dto';
import { TaskUpdateDto } from './dto/task-update.dto';
import { AuthenticatedUser } from '@modules/auth/authenticated-user.type';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async findAllPaginated(filters: TaskListFiltersDto, currentUser?: AuthenticatedUser) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const scopedFilters =
      currentUser?.role === 'pyme'
        ? { ...filters, pymeId: this.requirePymeId(currentUser), consultantId: undefined }
        : currentUser?.role === 'consultor'
          ? { ...filters, consultantId: currentUser.id }
          : filters;
    const { data, total } = await this.taskRepository.findAllPaginated(page, limit, scopedFilters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const task = await this.taskRepository.findOne(id);
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    return task;
  }

  async findOneForUser(id: number, currentUser: AuthenticatedUser) {
    const task = await this.findOne(id);
    const participantId = currentUser.role === 'pyme' ? this.requirePymeId(currentUser) : currentUser.id;
    if (
      (currentUser.role === 'pyme' && task.pymeId !== participantId) ||
      (currentUser.role === 'consultor' && task.consultantId !== participantId)
    ) {
      throw new ForbiddenException('No tienes acceso a esta tarea');
    }
    return task;
  }

  createForUser(data: TaskCreateDto, currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    return this.create({
      ...data,
      pymeId: currentUser.role === 'pyme' ? this.requirePymeId(currentUser) : data.pymeId,
    });
  }

  create(data: TaskCreateDto) {
    return this.taskRepository.create({
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      status: data.status ?? 'pendiente',
    });
  }

  async update(id: number, data: TaskUpdateDto) {
    await this.findOne(id);
    return this.taskRepository.update(id, {
      ...data,
      title: data.title?.trim(),
      description: data.description?.trim(),
    });
  }

  async updateForUser(id: number, data: TaskUpdateDto, currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    await this.findOneForUser(id, currentUser);
    return this.update(id, data);
  }

  async updateStatus(id: number, status: TaskUpdateDto['status']) {
    await this.findOne(id);
    return this.taskRepository.update(id, { status });
  }

  async updateStatusForUser(id: number, status: TaskUpdateDto['status'], currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    await this.findOneForUser(id, currentUser);
    return this.updateStatus(id, status);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.taskRepository.delete(id);
  }

  async deleteForUser(id: number, currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    await this.findOneForUser(id, currentUser);
    return this.taskRepository.delete(id);
  }

  private requirePymeId(currentUser: AuthenticatedUser) {
    if (!currentUser.pymeId) throw new ForbiddenException('No tienes una empresa asociada');
    return currentUser.pymeId;
  }

  private requireWriteAccess(currentUser: AuthenticatedUser) {
    if (currentUser.role === 'pyme' && currentUser.membershipRole !== 'owner') {
      throw new ForbiddenException('Tu acceso a la empresa es de solo lectura');
    }
  }
}
