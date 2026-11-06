import { TaskJoinQuery } from '@queries/task/task-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { Trace } from '@erixcel/traceflow';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskCreateDto } from '@modules/admin/modules/task/dto/create.dto';
import { TaskListFiltersDto } from '@modules/admin/modules/task/dto/find-all.dto';
import { TaskUpdateDto } from '@modules/admin/modules/task/dto/update.dto';
import { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';

// Gestiona las tareas de las consultorías.
@Trace({ name: 'task', type: 'service' })
@Injectable()
export class TaskService {
  constructor(
    private readonly taskJoinQuery: TaskJoinQuery,
    private readonly taskQuery: TaskQuery,
  ) {}

  async findAllPaginated(filters: TaskListFiltersDto, currentUser?: AuthenticatedUser) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const scopedFilters =
      currentUser?.role === 'pyme'
        ? { ...filters, pymeId: this.requirePymeId(currentUser), consultantId: undefined }
        : currentUser?.role === 'consultor'
          ? { ...filters, consultantId: currentUser.id }
          : filters;
    const { data, total } = await this.taskJoinQuery.findAllPaginated(page, limit, scopedFilters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const task = await this.taskJoinQuery.findOne(id);
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
    return this.taskQuery.create({
      ...data,
      title: data.title.trim(),
      description: data.description.trim(),
      status: data.status ?? 'pendiente',
    });
  }

  async update(id: number, data: TaskUpdateDto) {
    await this.findOne(id);
    return this.taskQuery.update(id, {
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
    return this.taskQuery.update(id, { status });
  }

  async updateStatusForUser(id: number, status: TaskUpdateDto['status'], currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    await this.findOneForUser(id, currentUser);
    return this.updateStatus(id, status);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.taskQuery.delete(id);
  }

  async deleteForUser(id: number, currentUser: AuthenticatedUser) {
    this.requireWriteAccess(currentUser);
    await this.findOneForUser(id, currentUser);
    return this.taskQuery.delete(id);
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
