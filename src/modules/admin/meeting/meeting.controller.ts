import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { MeetingCreateDto } from './dto/meeting-create.dto';
import { MeetingFinalizeDto } from './dto/meeting-finalize.dto';
import { MeetingListDto, MeetingListFiltersDto } from './dto/meeting-list.dto';
import { MeetingRecordingDto } from './dto/meeting-recording.dto';
import { MeetingFinalizeResultDto, MeetingResultDto } from './dto/meeting-result.dto';
import { MeetingTeamsJoinDto, MeetingTeamsJoinResponseDto } from './dto/meeting-teams-join.dto';
import { MeetingUpdateDto } from './dto/meeting-update.dto';
import { MeetingService } from './meeting.service';

@ApiTags('meeting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/meeting')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all meetings paginated' })
  @ApiResponse({ status: 200, type: MeetingListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: MeetingListFiltersDto) {
    return this.meetingService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a meeting by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.meetingService.findOne(+id);
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

  @Post('teams-join/:id')
  @ApiOperation({ summary: 'Create an anonymous ACS token to join a Teams meeting inside the app' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: MeetingTeamsJoinResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  createTeamsJoinToken(@Param('id') id: string, @Body() joinDto: MeetingTeamsJoinDto) {
    return this.meetingService.createTeamsJoinToken(+id, joinDto);
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'List Microsoft Graph recordings for a meeting' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: [MeetingRecordingDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  getRecordings(@Param('id') id: string) {
    return this.meetingService.listMeetingRecordings(+id);
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
