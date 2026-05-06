import { PartialType } from '@nestjs/swagger';
import { TaskCreateDto } from './task-create.dto';

export class TaskUpdateDto extends PartialType(TaskCreateDto) {}
