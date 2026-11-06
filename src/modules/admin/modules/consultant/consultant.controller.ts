import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { ConsultantRemoveResultDto } from './dto/remove.dto';
import { ConsultantFindByUserResultDto } from './dto/find-by-user.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PymeListDto } from '@modules/admin/modules/pyme/dto/find-all.dto';
import { ConsultantCreateDto } from '@modules/admin/modules/consultant/dto/create.dto';
import { ConsultantListDto, ConsultantListFiltersDto } from '@modules/admin/modules/consultant/dto/find-all.dto';
import { ConsultantMeetingPymesFiltersDto } from '@modules/admin/modules/consultant/dto/meeting-pymes.dto';
import { ConsultantResultDto } from '@modules/admin/modules/consultant/dto/find-one.dto';
import { ConsultantUpdateDto } from '@modules/admin/modules/consultant/dto/update.dto';
import { ConsultantActiveDto } from '@modules/admin/modules/consultant/dto/set-active.dto';
import { ConsultantDiagnosticDocumentsDto } from '@modules/admin/modules/consultant/dto/diagnostic-documents.dto';
import {
  ConsultantDocumentListFiltersDto,
  ConsultantMeetingDocumentsDto,
} from '@modules/admin/modules/consultant/dto/meeting-documents.dto';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';

@ApiTags('consultant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/consultant')
export class ConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all consultants paginated' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters, true);
  }

  @Get('meeting-pymes')
  @ApiOperation({ summary: 'Get PYMEs with at least one meeting with current consultant' })
  @ApiResponse({ status: 200, type: PymeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'meetingPymes', type: 'controller' })
  meetingPymes(@Request() req: AuthenticatedRequest, @Query() filters: ConsultantMeetingPymesFiltersDto) {
    return this.consultantService.findMeetingPymes(req.user.id, filters);
  }

  @Get('documents/meetings')
  @ApiOperation({ summary: 'Get the current consultant meeting acts with PYME data' })
  @ApiResponse({ status: 200, type: ConsultantMeetingDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'meetingDocuments', type: 'controller' })
  meetingDocuments(@Request() req: AuthenticatedRequest, @Query() filters: ConsultantDocumentListFiltersDto) {
    return this.consultantService.findMeetingDocuments(req.user.id, filters);
  }

  @Get('documents/diagnostics')
  @ApiOperation({ summary: 'Get the current consultant diagnostics with PYME data' })
  @ApiResponse({ status: 200, type: ConsultantDiagnosticDocumentsDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'diagnosticDocuments', type: 'controller' })
  diagnosticDocuments(@Request() req: AuthenticatedRequest, @Query() filters: ConsultantDocumentListFiltersDto) {
    return this.consultantService.findDiagnosticDocuments(req.user.id, filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.findOne(id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a consultant profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantFindByUserResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findByUser', type: 'controller' })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.consultantService.findByUserId(userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new consultant profile' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Body() createConsultantDto: ConsultantCreateDto) {
    return this.consultantService.create(createConsultantDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateConsultantDto: ConsultantUpdateDto) {
    return this.consultantService.update(id, updateConsultantDto);
  }

  @Patch('active/:id')
  @ApiOperation({ summary: 'Update consultant availability' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'setActive', type: 'controller' })
  setActive(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ConsultantActiveDto,
  ) {
    return this.consultantService.setActive(id, data, req.user.id);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.consultantService.delete(id);
  }
}
