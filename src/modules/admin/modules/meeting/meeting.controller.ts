import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { MeetingRemoveResultDto } from './dto/remove.dto';
import { MeetingConfirmResultDto } from './dto/confirm.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { MeetingCalendarFiltersDto, MeetingCalendarListDto } from '@modules/admin/modules/meeting/dto/calendar.dto';
import { MeetingCreateDto } from '@modules/admin/modules/meeting/dto/create.dto';
import { MeetingConfirmOptionDto } from '@modules/admin/modules/meeting/dto/confirm-option.dto';
import { MeetingFinalizeDto } from '@modules/admin/modules/meeting/dto/finalize.dto';
import { MeetingListDto, MeetingListFiltersDto } from '@modules/admin/modules/meeting/dto/find-all.dto';
import { MeetingRecordingDto } from '@modules/admin/modules/meeting/dto/get-recordings.dto';
import { MeetingConsultantCancelResultDto } from '@modules/admin/modules/meeting/dto/cancel-by-consultant.dto';
import { MeetingFinalizeResultDto } from '@modules/admin/modules/meeting/dto/finalize.dto';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';
import { MeetingUpdateDto } from '@modules/admin/modules/meeting/dto/update.dto';
import { MeetingCopilotSummaryDto } from '@modules/admin/modules/meeting/dto/get-copilot-summary.dto';
import { MeetingAccessResultDto } from '@modules/admin/modules/meeting/dto/access.dto';
import { MeetingConsultantCancelDto } from '@modules/admin/modules/meeting/dto/cancel-by-consultant.dto';
import { MeetingService } from '@modules/admin/modules/meeting/meeting.service';

@ApiTags('meeting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/meeting')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get('calendar')
  @ApiOperation({ summary: 'Get lightweight calendar meetings for the authenticated user and date range' })
  @ApiResponse({ status: 200, type: MeetingCalendarListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'calendar', type: 'controller' })
  calendar(@Request() request: AuthenticatedRequest, @Query() filters: MeetingCalendarFiltersDto) {
    return this.meetingService.findCalendarPaginated(filters, request.user);
  }

  @Get('find-all')
  @ApiOperation({ summary: 'Get all meetings paginated' })
  @ApiResponse({ status: 200, type: MeetingListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Request() request: AuthenticatedRequest, @Query() filters: MeetingListFiltersDto) {
    return this.meetingService.findAllPaginated(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a meeting by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.findOneForRequester(id, request.user);
  }

  @Get('access/:id')
  @ApiOperation({ summary: 'Resolve protected Teams access for an authenticated meeting participant' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingAccessResultDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  @TraceNode({ name: 'access', type: 'controller' })
  access(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.resolveAccess(id, request.user);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Request() request: AuthenticatedRequest, @Body() createMeetingDto: MeetingCreateDto) {
    return this.meetingService.createForRequester(createMeetingDto, request.user);
  }

  @Post('confirm/:id')
  @ApiOperation({ summary: 'Confirm a requested meeting and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingConfirmResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'confirm', type: 'controller' })
  confirm(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.confirmForRequester(id, request.user);
  }

  @Post('confirm-option/:id')
  @ApiOperation({ summary: 'Confirm one of the proposed meeting times and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'confirmOption', type: 'controller' })
  confirmOption(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmOptionDto: MeetingConfirmOptionDto,
  ) {
    return this.meetingService.confirmProposedOption(id, confirmOptionDto, request.user);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingRecordingDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'getRecordings', type: 'controller' })
  getRecordings(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.listMeetingRecordingsForRequester(id, request.user);
  }

  @Get('hubsme-ai/:id')
  @ApiOperation({ summary: 'Get Hubsme AI insights (summary & action tasks) for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingCopilotSummaryDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'getCopilotSummary', type: 'controller' })
  getCopilotSummary(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.getCopilotSummaryForRequester(id, request.user);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeetingDto: MeetingUpdateDto,
  ) {
    return this.meetingService.updateForRequester(id, updateMeetingDto, request.user);
  }

  @Post('cancel-by-consultant/:id')
  @ApiOperation({ summary: 'Cancel a paid meeting as its consultant and issue a restricted replacement code' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingConsultantCancelResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @TraceNode({ name: 'cancelByConsultant', type: 'controller' })
  cancelByConsultant(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: MeetingConsultantCancelDto,
  ) {
    return this.meetingService.cancelByConsultant(id, body, request.user);
  }

  @Post('finalize/:id')
  @ApiOperation({ summary: 'Finalize meeting, save markdown minutes and create follow-up tasks' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingFinalizeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'finalize', type: 'controller' })
  finalize(
    @Request() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() finalizeDto: MeetingFinalizeDto,
  ) {
    return this.meetingService.finalizeForRequester(id, finalizeDto, request.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Request() request: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.meetingService.deleteForRequester(id, request.user);
  }
}
