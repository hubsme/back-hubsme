import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { MeetingCalendarFiltersDto, MeetingCalendarListDto } from './dto/meeting-calendar.dto';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingConfirmOptionDto } from './dto/meeting-confirm-option.dto';
import { MeetingFinalizeDto } from './dto/meeting-finalize.dto';
import { MeetingListDto, MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingRecordingDto } from './dto/meeting-recording.dto';
import { MeetingFinalizeResultDto, MeetingResultDto } from './dto/meeting-result.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { MeetingCopilotSummaryDto } from './dto/meeting-copilot-summary.dto';
import { MeetingAccessResultDto } from './dto/meeting-access.dto';
import { MeetingService } from './meeting.service';

type AuthenticatedRequest = { user: User };

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
  create(@Body() createMeetingDto: MeetingCreateDto) {
    return this.meetingService.create(createMeetingDto);
  }

  @Post('confirm/:id')
  @ApiOperation({ summary: 'Confirm a requested meeting and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  confirm(@Param('id') id: string) {
    return this.meetingService.confirm(+id);
  }

  @Post('confirm-option/:id')
  @ApiOperation({ summary: 'Confirm one of the proposed meeting times and create its Teams meeting URL internally' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  confirmOption(@Param('id') id: string, @Body() confirmOptionDto: MeetingConfirmOptionDto) {
    return this.meetingService.confirmProposedOption(+id, confirmOptionDto);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingRecordingDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getRecordings(@Param('id') id: string) {
    return this.meetingService.listMeetingRecordings(+id);
  }

  @Get('hubsme-ai/:id')
  @ApiOperation({ summary: 'Get Hubsme AI insights (summary & action tasks) for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingCopilotSummaryDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getCopilotSummary(@Param('id') id: string) {
    return this.meetingService.getCopilotSummary(+id);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateMeetingDto: MeetingUpdateDto) {
    return this.meetingService.update(+id, updateMeetingDto);
  }

  @Post('finalize/:id')
  @ApiOperation({ summary: 'Finalize meeting, save markdown minutes and create follow-up tasks' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingFinalizeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  finalize(@Param('id') id: string, @Body() finalizeDto: MeetingFinalizeDto) {
    return this.meetingService.finalize(+id, finalizeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.meetingService.delete(+id);
  }
}
