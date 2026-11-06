import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { PymeRemoveResultDto } from './dto/remove.dto';
import { PymeFindByUserResultDto } from './dto/find-by-user.dto';
import { PymeRemoveMemberResultDto } from './dto/remove-member.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { ConsultantListDto } from '@modules/admin/modules/consultant/dto/find-all.dto';
import { PymeCreateDto } from '@modules/admin/modules/pyme/dto/create.dto';
import { PymeListDto, PymeListFiltersDto } from '@modules/admin/modules/pyme/dto/find-all.dto';
import { PymeMeetingConsultantsFiltersDto } from '@modules/admin/modules/pyme/dto/meeting-consultants.dto';
import { PymeResultDto } from '@modules/admin/modules/pyme/dto/find-one.dto';
import { PymeUpdateDto } from '@modules/admin/modules/pyme/dto/update.dto';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { PymeDiagnosticDocumentsDto } from '@modules/admin/modules/pyme/dto/diagnostic-documents.dto';
import {
  PymeDocumentListFiltersDto,
  PymeMeetingDocumentsDto,
} from '@modules/admin/modules/pyme/dto/meeting-documents.dto';
import {
  CreatePymeInvitationDto,
  PymeInvitationResultDto,
} from '@modules/admin/modules/pyme/dto/create-invitation.dto';
import { MessageResultDto } from '@modules/admin/modules/pyme/dto/revoke-invitation.dto';
import { PymeTeamResultDto } from '@modules/admin/modules/pyme/dto/team.dto';

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
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('meeting-consultants')
  @ApiOperation({ summary: 'Get consultants with at least one meeting with current PYME' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'meetingConsultants', type: 'controller' })
  meetingConsultants(@Request() req: AuthenticatedRequest, @Query() filters: PymeMeetingConsultantsFiltersDto) {
    return this.pymeService.findMeetingConsultants(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('documents/meetings')
  @ApiOperation({ summary: 'Get the current PYME meeting acts with consultant data' })
  @ApiResponse({ status: 200, type: PymeMeetingDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'meetingDocuments', type: 'controller' })
  meetingDocuments(@Request() req: AuthenticatedRequest, @Query() filters: PymeDocumentListFiltersDto) {
    return this.pymeService.findMeetingDocuments(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('documents/diagnostics')
  @ApiOperation({ summary: 'Get the current PYME diagnostics with PYME data' })
  @ApiResponse({ status: 200, type: PymeDiagnosticDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'diagnosticDocuments', type: 'controller' })
  diagnosticDocuments(@Request() req: AuthenticatedRequest, @Query() filters: PymeDocumentListFiltersDto) {
    return this.pymeService.findDiagnosticDocuments(req.user.pymeId ?? req.user.id, filters);
  }

  @Get('team')
  @ApiOperation({ summary: 'Get members and pending invitations for the current PYME' })
  @ApiResponse({ status: 200, type: PymeTeamResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'team', type: 'controller' })
  team(@Request() req: AuthenticatedRequest) {
    return this.pymeService.findTeam(req.user);
  }

  @Post('invitations')
  @ApiOperation({ summary: 'Invite a user to the current PYME' })
  @ApiResponse({ status: 200, type: PymeInvitationResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'createInvitation', type: 'controller' })
  createInvitation(@Request() req: AuthenticatedRequest, @Body() body: CreatePymeInvitationDto) {
    return this.pymeService.createInvitation(req.user, body);
  }

  @Delete('invitations/:id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Revoke a pending PYME invitation' })
  @ApiResponse({ status: 200, type: MessageResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'revokeInvitation', type: 'controller' })
  revokeInvitation(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.pymeService.revokeInvitation(req.user, id);
  }

  @Delete('members/:userId')
  @ApiParam({ name: 'userId', type: String })
  @ApiOperation({ summary: 'Remove a member from the current PYME' })
  @ApiResponse({ status: 200, type: PymeRemoveMemberResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'removeMember', type: 'controller' })
  removeMember(@Request() req: AuthenticatedRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.pymeService.removeMember(req.user, userId);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.pymeService.findOneForUser(req.user, id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a PYME profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: PymeFindByUserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findByUser', type: 'controller' })
  findByUser(@Request() req: AuthenticatedRequest, @Param('userId', ParseIntPipe) userId: number) {
    return this.pymeService.findByUserForUser(req.user, userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new PYME profile' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Request() req: AuthenticatedRequest, @Body() createPymeDto: PymeCreateDto) {
    return this.pymeService.createForUser(req.user, createPymeDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePymeDto: PymeUpdateDto,
  ) {
    return this.pymeService.updateForUser(req.user, id, updatePymeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Request() req: AuthenticatedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.pymeService.deleteForUser(req.user, id);
  }
}
