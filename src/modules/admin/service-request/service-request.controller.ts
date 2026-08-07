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
import { ServiceRequestCreateMultipartDto } from './dto/service-request-create.dto';
import { ServiceRequestListDto, ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';
import { ServiceRequestMilestoneMeetingDto } from './dto/service-request-milestone-meeting.dto';
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
}
