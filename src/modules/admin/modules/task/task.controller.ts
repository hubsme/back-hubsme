import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { TaskRemoveResultDto } from './dto/remove.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { TaskCreateDto } from '@modules/admin/modules/task/dto/create.dto';
import { TaskListDto, TaskListFiltersDto } from '@modules/admin/modules/task/dto/find-all.dto';
import { TaskResultDto } from '@modules/admin/modules/task/dto/find-one.dto';
import { TaskStatusDto } from '@modules/admin/modules/task/dto/update-status.dto';
import { TaskUpdateDto } from '@modules/admin/modules/task/dto/update.dto';
import { TaskService } from '@modules/admin/modules/task/task.service';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';

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
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Request() req: AuthenticatedRequest, @Query() filters: TaskListFiltersDto) {
    return this.taskService.findAllPaginated(filters, req.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOneForUser(id, req.user);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Request() req: AuthenticatedRequest, @Body() createTaskDto: TaskCreateDto) {
    return this.taskService.createForUser(createTaskDto, req.user);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: TaskUpdateDto,
  ) {
    return this.taskService.updateForUser(id, updateTaskDto, req.user);
  }

  @Patch('update-status/:id')
  @ApiOperation({ summary: 'Update only the task status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'updateStatus', type: 'controller' })
  updateStatus(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: TaskStatusDto,
  ) {
    return this.taskService.updateStatusForUser(id, statusDto.status, req.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a task' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: TaskRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.taskService.deleteForUser(id, req.user);
  }
}
