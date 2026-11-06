import { TaskJoinQuery } from '@queries/task/task-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { Module } from '@nestjs/common';
import { TaskController } from '@modules/admin/modules/task/task.controller';
import { TaskService } from '@modules/admin/modules/task/task.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, TaskJoinQuery, TaskQuery],
  exports: [TaskService],
})
export class TaskModule {}
