import { TraceNode } from '@erixcel/traceflow';
import { ServiceRequestDeleteEvidenceResultDto } from './dto/delete-evidence.dto';
import { ServiceRequestRemoveMilestoneResultDto } from './dto/remove-milestone.dto';
import { ServiceRequestCompleteServiceResultDto } from './dto/complete-service.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ServiceRequestCreateMultipartDto } from '@modules/admin/modules/service-request/dto/create.dto';
import {
  ServiceRequestListDto,
  ServiceRequestListFiltersDto,
} from '@modules/admin/modules/service-request/dto/find-all.dto';
import { ServiceRequestDeclineDto } from '@modules/admin/modules/service-request/dto/decline.dto';
import { ServiceRequestProposalDto } from '@modules/admin/modules/service-request/dto/send-proposal.dto';
import { ServiceRequestMilestoneMeetingDto } from '@modules/admin/modules/service-request/dto/schedule-milestone-meeting.dto';
import { ServiceRequestEvidenceMultipartDto } from '@modules/admin/modules/service-request/dto/upload-evidence.dto';
import { ServiceRequestExtraMilestoneMeetingDto } from '@modules/admin/modules/service-request/dto/add-extra-milestone-meeting.dto';
import { ServiceRequestMilestoneUpdateDto } from '@modules/admin/modules/service-request/dto/update-milestone.dto';
import { ServiceRequestResultDto } from '@modules/admin/modules/service-request/dto/find-one.dto';
import type { ServiceRequestAuthenticatedRequest } from '@modules/admin/modules/service-request/types/service-request.type';
import { ServiceRequestService } from '@modules/admin/modules/service-request/service-request.service';
import {
  SERVICE_REQUEST_MAX_FILES,
  serviceRequestFileUploadOptions,
} from '@modules/admin/modules/service-request/config/service-request-upload.config';

@ApiTags('service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/service')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List service requests or proposals for the authenticated participant' })
  @ApiResponse({ status: 200, type: ServiceRequestListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: ServiceRequestListFiltersDto, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.findAllForUser(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a service request for the authenticated participant' })
  @ApiResponse({ status: 200, type: ServiceRequestResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.findOneForUser(id, request.user);
  }

  @Post('create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create and send a service request to one to three consultants as a PYME' })
  @ApiResponse({ status: 201, type: [ServiceRequestResultDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FilesInterceptor('files', SERVICE_REQUEST_MAX_FILES, serviceRequestFileUploadOptions))
  @TraceNode({ name: 'create', type: 'controller' })
  create(
    @Body() body: ServiceRequestCreateMultipartDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.create(body, files, request.user);
  }

  @Post('proposal/:id')
  @ApiOperation({ summary: 'Send a priced proposal as the assigned consultant' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'sendProposal', type: 'controller' })
  sendProposal(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestProposalDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.sendProposal(id, body, request.user);
  }

  @Post('decline/:id')
  @ApiOperation({ summary: 'Decline a service request or its priced proposal' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'decline', type: 'controller' })
  decline(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestDeclineDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.decline(id, body, request.user);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a paid service as completed by its PYME' })
  @ApiResponse({ status: 201, type: ServiceRequestCompleteServiceResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'completeService', type: 'controller' })
  completeService(@Param('id', ParseIntPipe) id: number, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.completeService(id, request.user);
  }

  @Post(':id/milestone-meeting')
  @ApiOperation({ summary: 'Propose three meeting times for a paid service milestone' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'scheduleMilestoneMeeting', type: 'controller' })
  scheduleMilestoneMeeting(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestMilestoneMeetingDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.scheduleMilestoneMeeting(id, body, request.user);
  }

  @Patch(':id/milestone/:index')
  @ApiOperation({ summary: 'Edit a service milestone before it has a meeting' })
  @ApiResponse({ status: 200, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'updateMilestone', type: 'controller' })
  updateMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @Body() body: ServiceRequestMilestoneUpdateDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.updateMilestone(id, index, body, request.user);
  }

  @Delete(':id/milestone/:index')
  @ApiOperation({ summary: 'Delete a service milestone before it has a meeting' })
  @ApiResponse({ status: 200, type: ServiceRequestRemoveMilestoneResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'removeMilestone', type: 'controller' })
  removeMilestone(
    @Param('id', ParseIntPipe) id: number,
    @Param('index', ParseIntPipe) index: number,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.removeMilestone(id, index, request.user);
  }

  @Post(':id/extra-milestone-meeting')
  @ApiOperation({ summary: 'Add an extra milestone and propose three meeting times' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'addExtraMilestoneMeeting', type: 'controller' })
  addExtraMilestoneMeeting(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestExtraMilestoneMeetingDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.addExtraMilestoneMeeting(id, body, request.user);
  }

  @Post(':id/evidence')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Attach evidence or a deliverable to a paid service as its consultant',
  })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FilesInterceptor('files', SERVICE_REQUEST_MAX_FILES, serviceRequestFileUploadOptions))
  @TraceNode({ name: 'uploadEvidence', type: 'controller' })
  uploadEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestEvidenceMultipartDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.uploadEvidence(id, body, files, request.user);
  }

  @Delete(':id/evidence/:attachmentId')
  @ApiOperation({
    summary: 'Delete a service evidence as its consultant before its milestone has a meeting',
  })
  @ApiResponse({ status: 200, type: ServiceRequestDeleteEvidenceResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'deleteEvidence', type: 'controller' })
  deleteEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId') attachmentId: string,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.deleteEvidence(id, attachmentId, request.user);
  }
}
