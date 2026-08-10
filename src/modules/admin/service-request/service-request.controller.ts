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
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ServiceRequestCreateMultipartDto } from './dto/service-request-create.dto';
import { ServiceRequestListDto, ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';
import { ServiceRequestMilestoneMeetingDto } from './dto/service-request-milestone-meeting.dto';
import {
  ServiceRequestEvidenceMultipartDto,
  ServiceRequestExtraMilestoneMeetingDto,
  ServiceRequestMilestoneUpdateDto,
} from './dto/service-request-progress.dto';
import { ServiceRequestResultDto } from './dto/service-request-result.dto';
import type { ServiceRequestAuthenticatedRequest } from './service-request.type';
import { ServiceRequestService } from './service-request.service';
import { SERVICE_REQUEST_MAX_FILES, serviceRequestFileUploadOptions } from './service-request-upload.config';

@ApiTags('service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/service')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List service requests or proposals for the authenticated participant' })
  @ApiResponse({ status: 200, type: ServiceRequestListDto })
  findAll(@Query() filters: ServiceRequestListFiltersDto, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.findAllForUser(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a service request for the authenticated participant' })
  @ApiResponse({ status: 200, type: ServiceRequestResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.findOneForUser(id, request.user);
  }

  @Post('create')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create and send a service request to one to three consultants as a PYME' })
  @ApiResponse({ status: 201, type: [ServiceRequestResultDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FilesInterceptor('files', SERVICE_REQUEST_MAX_FILES, serviceRequestFileUploadOptions))
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
  decline(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestDeclineDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.decline(id, body, request.user);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a paid service as completed by its PYME' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  completeService(@Param('id', ParseIntPipe) id: number, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.completeService(id, request.user);
  }

  @Post(':id/milestone-meeting')
  @ApiOperation({ summary: 'Propose three meeting times for a paid service milestone' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
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
  @ApiResponse({ status: 200, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
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
  addExtraMilestoneMeeting(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestExtraMilestoneMeetingDto,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.addExtraMilestoneMeeting(id, body, request.user);
  }

  @Post(':id/evidence')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Attach evidence or a deliverable to a paid service' })
  @ApiResponse({ status: 201, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @UseInterceptors(FilesInterceptor('files', SERVICE_REQUEST_MAX_FILES, serviceRequestFileUploadOptions))
  uploadEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ServiceRequestEvidenceMultipartDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.uploadEvidence(id, body, files, request.user);
  }

  @Delete(':id/evidence/:attachmentId')
  @ApiOperation({ summary: 'Delete a service evidence before its milestone has a meeting' })
  @ApiResponse({ status: 200, type: ServiceRequestResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  deleteEvidence(
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId') attachmentId: string,
    @Request() request: ServiceRequestAuthenticatedRequest,
  ) {
    return this.serviceRequestService.deleteEvidence(id, attachmentId, request.user);
  }
}
