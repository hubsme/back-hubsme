import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/authenticated-user.type';
import { ConsultantListDto } from '@modules/admin/consultant/dto/consultant-list.dto';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListDto, PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeMeetingConsultantsFiltersDto } from './dto/pyme-meeting-consultants.dto';
import { PymeResultDto } from './dto/pyme-result.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';
import { PymeService } from './pyme.service';
import {
  PymeDiagnosticDocumentsDto,
  PymeDocumentListFiltersDto,
  PymeMeetingDocumentsDto,
} from './dto/pyme-document.dto';
import {
  CreatePymeInvitationDto,
  MessageResultDto,
  PymeInvitationResultDto,
  PymeTeamResultDto,
} from './dto/pyme-membership.dto';

@ApiTags('pyme')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pyme')
export class PymeController {
  constructor(private readonly pymeService: PymeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all PYMEs paginated' })
  @ApiResponse({ status: 200, type: PymeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('meeting-consultants')
  @ApiOperation({ summary: 'Get consultants with at least one meeting with current PYME' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  meetingConsultants(@Request() req: AuthenticatedRequest, @Query() filters: PymeMeetingConsultantsFiltersDto) {
    return this.pymeService.findMeetingConsultants(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('documents/meetings')
  @ApiOperation({ summary: 'Get the current PYME meeting acts with consultant data' })
  @ApiResponse({ status: 200, type: PymeMeetingDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  meetingDocuments(@Request() req: AuthenticatedRequest, @Query() filters: PymeDocumentListFiltersDto) {
    return this.pymeService.findMeetingDocuments(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('documents/diagnostics')
  @ApiOperation({ summary: 'Get the current PYME diagnostics with PYME data' })
  @ApiResponse({ status: 200, type: PymeDiagnosticDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  diagnosticDocuments(@Request() req: AuthenticatedRequest, @Query() filters: PymeDocumentListFiltersDto) {
    return this.pymeService.findDiagnosticDocuments(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get members and pending invitations for the current PYME' })
  @ApiResponse({ status: 200, type: PymeTeamResultDto })
  team(@Request() req: AuthenticatedRequest) {
    return this.pymeService.findTeam(req.user);
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Invite a user to the current PYME' })
  @ApiResponse({ status: 200, type: PymeInvitationResultDto })
  createInvitation(@Request() req: AuthenticatedRequest, @Body() body: CreatePymeInvitationDto) {
    return this.pymeService.createInvitation(req.user, body);
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'Revoke a pending PYME invitation' })
  @ApiResponse({ status: 200, type: MessageResultDto })
  revokeInvitation(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pymeService.revokeInvitation(req.user, +id);
  }

  @Delete('members/:userId')
  @ApiOperation({ summary: 'Remove a member from the current PYME' })
  @ApiResponse({ status: 200, type: MessageResultDto })
  removeMember(@Request() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.pymeService.removeMember(req.user, +userId);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pymeService.findOneForUser(req.user, +id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a PYME profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Request() req: AuthenticatedRequest, @Param('userId') userId: string) {
    return this.pymeService.findByUserForUser(req.user, +userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new PYME profile' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Request() req: AuthenticatedRequest, @Body() createPymeDto: PymeCreateDto) {
    return this.pymeService.createForUser(req.user, createPymeDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updatePymeDto: PymeUpdateDto) {
    return this.pymeService.updateForUser(req.user, +id, updatePymeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.pymeService.deleteForUser(req.user, +id);
  }
}
