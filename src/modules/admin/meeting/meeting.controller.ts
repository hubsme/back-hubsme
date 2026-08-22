import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/authenticated-user.type';
import { MeetingCalendarFiltersDto, MeetingCalendarListDto } from './dto/meeting-calendar.dto';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingConfirmOptionDto } from './dto/meeting-confirm-option.dto';
import { MeetingFinalizeDto } from './dto/meeting-finalize.dto';
import { MeetingListDto, MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingRecordingDto } from './dto/meeting-recording.dto';
import { MeetingConsultantCancelResultDto, MeetingFinalizeResultDto, MeetingResultDto } from './dto/meeting-result.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { MeetingCopilotSummaryDto } from './dto/meeting-copilot-summary.dto';
import { MeetingAccessResultDto } from './dto/meeting-access.dto';
import { MeetingConsultantCancelDto } from './dto/meeting-consultant-cancel.dto';
import { MeetingService } from './meeting.service';

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
  calendar(@Request() request: AuthenticatedRequest, @Query() filters: MeetingCalendarFiltersDto) {
    return this.meetingService.findCalendarPaginated(filters, request.user);
  }

  @Get('find-all')
  @ApiOperation({ summary: 'Get all meetings paginated' })
  @ApiResponse({ status: 200, type: MeetingListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Request() request: AuthenticatedRequest, @Query() filters: MeetingListFiltersDto) {
    return this.meetingService.findAllPaginated(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a meeting by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.findOneForRequester(+id, request.user);
  }

  @Get('access/:id')
  @ApiOperation({ summary: 'Resolve protected Teams access for an authenticated meeting participant' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingAccessResultDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  access(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.resolveAccess(+id, request.user);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new meeting' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Request() request: AuthenticatedRequest, @Body() createMeetingDto: MeetingCreateDto) {
    return this.meetingService.createForRequester(createMeetingDto, request.user);
  }

  @Post('confirm/:id')
  @ApiOperation({ summary: 'Confirm a requested meeting and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  confirm(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.confirmForRequester(+id, request.user);
  }

  @Post('confirm-option/:id')
  @ApiOperation({ summary: 'Confirm one of the proposed meeting times and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  confirmOption(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() confirmOptionDto: MeetingConfirmOptionDto,
  ) {
    return this.meetingService.confirmProposedOption(+id, confirmOptionDto, request.user);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingRecordingDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getRecordings(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.listMeetingRecordingsForRequester(+id, request.user);
  }

  @Get('hubsme-ai/:id')
  @ApiOperation({ summary: 'Get Hubsme AI insights (summary & action tasks) for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingCopilotSummaryDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getCopilotSummary(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.getCopilotSummaryForRequester(+id, request.user);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateMeetingDto: MeetingUpdateDto,
  ) {
    return this.meetingService.updateForRequester(+id, updateMeetingDto, request.user);
  }

  @Post('cancel-by-consultant/:id')
  @ApiOperation({ summary: 'Cancel a paid meeting as its consultant and issue a restricted replacement code' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingConsultantCancelResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 403, type: HttpErrorDto })
  cancelByConsultant(
    @Request() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: MeetingConsultantCancelDto,
  ) {
    return this.meetingService.cancelByConsultant(+id, body, request.user);
  }

  @Post('finalize/:id')
  @ApiOperation({ summary: 'Finalize meeting, save markdown minutes and create follow-up tasks' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingFinalizeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  finalize(@Request() request: AuthenticatedRequest, @Param('id') id: string, @Body() finalizeDto: MeetingFinalizeDto) {
    return this.meetingService.finalizeForRequester(+id, finalizeDto, request.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Request() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.meetingService.deleteForRequester(+id, request.user);
  }
}
