import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { TaskCreateDto } from './dto/task-create.dto';
import { TaskListDto, TaskListFiltersDto } from './dto/task-list.dto';
import { TaskResultDto } from './dto/task-result.dto';
import { TaskStatusDto } from './dto/task-status.dto';
import { TaskUpdateDto } from './dto/task-update.dto';
import { TaskService } from './task.service';
import type { AuthenticatedRequest } from '@modules/auth/authenticated-user.type';

@ApiTags('task')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all tasks paginated' })
  @ApiResponse({ status: 200, type: TaskListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: TaskListFiltersDto) {
    return this.taskService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.taskService.findOneForUser(+id, req.user);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Request() req: AuthenticatedRequest, @Body() createTaskDto: TaskCreateDto) {
    return this.taskService.createForUser(createTaskDto, req.user);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateTaskDto: TaskUpdateDto) {
    return this.taskService.updateForUser(+id, updateTaskDto, req.user);
  }

  @Patch('update-status/:id')
  @ApiOperation({ summary: 'Update only the task status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  updateStatus(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() statusDto: TaskStatusDto) {
    return this.taskService.updateStatusForUser(+id, statusDto.status, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a task' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.taskService.deleteForUser(+id, req.user);
  }
}
