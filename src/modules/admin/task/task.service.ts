import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepository } from '@repositories/task.repository';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskListFiltersDto } from './dto/task-list.dto';
import { TaskUpdateDto } from './dto/task-update.dto';

@Injectable()
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async findAllPaginated(filters: TaskListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.taskRepository.findAllPaginated(page, limit, filters);
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

  async updateStatus(id: number, status: TaskUpdateDto['status']) {
    await this.findOne(id);
    return this.taskRepository.update(id, { status });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.taskRepository.delete(id);
  }
}
