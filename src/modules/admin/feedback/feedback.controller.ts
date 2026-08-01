import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { FeedbackCreateMultipartDto } from './dto/feedback-create.dto';
import { FeedbackListDto, FeedbackListFiltersDto } from './dto/feedback-list.dto';
import { FeedbackReplyCreateDto } from './dto/feedback-reply.dto';
import { FeedbackResultDto } from './dto/feedback-result.dto';
import type { FeedbackAuthenticatedRequest } from './feedback-request.type';
import { FeedbackService } from './feedback.service';
import { FEEDBACK_MAX_IMAGES, feedbackImageUploadOptions } from './feedback-upload.config';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List the authenticated user support comments' })
  @ApiResponse({ status: 200, type: FeedbackListDto })
  findAll(@Query() filters: FeedbackListFiltersDto, @Request() request: FeedbackAuthenticatedRequest) {
    return this.feedbackService.findAllForUser(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get an authenticated user support comment' })
  @ApiResponse({ status: 200, type: FeedbackResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() request: FeedbackAuthenticatedRequest) {
    return this.feedbackService.findOneForUser(id, request.user);
  }

  @Post('create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a support comment with optional screenshots' })
  @ApiResponse({ status: 201, type: FeedbackResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FilesInterceptor('images', FEEDBACK_MAX_IMAGES, feedbackImageUploadOptions))
  create(
    @Body() body: FeedbackCreateMultipartDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Request() request: FeedbackAuthenticatedRequest,
  ) {
    return this.feedbackService.create(body, files, request.user);
  }

  @Post('reply/:id')
  @ApiOperation({ summary: 'Reply to an authenticated user support comment' })
  @ApiResponse({ status: 201, type: FeedbackResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FeedbackReplyCreateDto,
    @Request() request: FeedbackAuthenticatedRequest,
  ) {
    return this.feedbackService.replyAsUser(id, body, request.user);
  }
}
