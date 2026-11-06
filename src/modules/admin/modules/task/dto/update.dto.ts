import { Trace } from '@erixcel/traceflow';
import { PartialType } from '@nestjs/swagger';
import { TaskCreateDto } from '@modules/admin/modules/task/dto/create.dto';

@Trace({ type: 'validation' })
export class TaskUpdateDto extends PartialType(TaskCreateDto) {}
