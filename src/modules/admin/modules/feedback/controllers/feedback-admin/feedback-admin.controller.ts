import { TraceNode } from '@erixcel/traceflow';
import { FeedbackAdminReplyResultDto } from './dto/reply.dto';
import { FeedbackAdminFindOneResultDto } from './dto/find-one.dto';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import { FeedbackAdminListFiltersDto } from '@modules/admin/modules/feedback/controllers/feedback-admin/dto/find-all.dto';
import { FeedbackListDto } from '@modules/admin/modules/feedback/dto/find-all.dto';
import { FeedbackReplyCreateDto } from '@modules/admin/modules/feedback/dto/reply.dto';
import { FeedbackResultDto } from '@modules/admin/modules/feedback/dto/find-one.dto';
import { FeedbackStatusUpdateDto } from '@modules/admin/modules/feedback/controllers/feedback-admin/dto/update-status.dto';
import type { FeedbackAdminAuthenticatedRequest } from '@modules/admin/modules/feedback/types/feedback-request.type';
import { FeedbackService } from '@modules/admin/modules/feedback/feedback.service';

@ApiTags('feedbackAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/feedback')
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List support comments in the administrative panel' })
  @ApiResponse({ status: 200, type: FeedbackListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: FeedbackAdminListFiltersDto) {
    return this.feedbackService.findAllForAdmin(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get support comment details in the administrative panel' })
  @ApiResponse({ status: 200, type: FeedbackAdminFindOneResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.findOneForAdmin(id);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update a support comment status' })
  @ApiResponse({ status: 200, type: FeedbackResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'updateStatus', type: 'controller' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FeedbackStatusUpdateDto,
    @Request() request: FeedbackAdminAuthenticatedRequest,
  ) {
    return this.feedbackService.updateStatus(id, body, request.admin.username);
  }

  @Post('reply/:id')
  @ApiOperation({ summary: 'Reply to a support comment as an administrator' })
  @ApiResponse({ status: 201, type: FeedbackAdminReplyResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'reply', type: 'controller' })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FeedbackReplyCreateDto,
    @Request() request: FeedbackAdminAuthenticatedRequest,
  ) {
    return this.feedbackService.replyAsAdmin(id, body, request.admin.username);
  }
}
