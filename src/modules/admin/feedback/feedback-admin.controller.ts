import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { FeedbackAdminListFiltersDto, FeedbackListDto } from './dto/feedback-list.dto';
import { FeedbackReplyCreateDto } from './dto/feedback-reply.dto';
import { FeedbackResultDto } from './dto/feedback-result.dto';
import { FeedbackStatusUpdateDto } from './dto/feedback-status.dto';
import type { FeedbackAdminAuthenticatedRequest } from './feedback-request.type';
import { FeedbackService } from './feedback.service';

@ApiTags('feedbackAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/feedback')
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List support comments in the administrative panel' })
  @ApiResponse({ status: 200, type: FeedbackListDto })
  findAll(@Query() filters: FeedbackAdminListFiltersDto) {
    return this.feedbackService.findAllForAdmin(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get support comment details in the administrative panel' })
  @ApiResponse({ status: 200, type: FeedbackResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.feedbackService.findOneForAdmin(id);
  }

  @Patch('status/:id')
  @ApiOperation({ summary: 'Update a support comment status' })
  @ApiResponse({ status: 200, type: FeedbackResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FeedbackStatusUpdateDto,
    @Request() request: FeedbackAdminAuthenticatedRequest,
  ) {
    return this.feedbackService.updateStatus(id, body, request.admin.username);
  }

  @Post('reply/:id')
  @ApiOperation({ summary: 'Reply to a support comment as an administrator' })
  @ApiResponse({ status: 201, type: FeedbackResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FeedbackReplyCreateDto,
    @Request() request: FeedbackAdminAuthenticatedRequest,
  ) {
    return this.feedbackService.replyAsAdmin(id, body, request.admin.username);
  }
}
