import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ServiceRequestCreateDto } from './dto/service-request-create.dto';
import { ServiceRequestListDto, ServiceRequestListFiltersDto } from './dto/service-request-list.dto';
import { ServiceRequestDeclineDto, ServiceRequestProposalDto } from './dto/service-request-response.dto';
import { ServiceRequestResultDto } from './dto/service-request-result.dto';
import type { ServiceRequestAuthenticatedRequest } from './service-request.type';
import { ServiceRequestService } from './service-request.service';

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
  @ApiOperation({ summary: 'Create and send a service request to one to three consultants as a PYME' })
  @ApiResponse({ status: 201, type: [ServiceRequestResultDto] })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() body: ServiceRequestCreateDto, @Request() request: ServiceRequestAuthenticatedRequest) {
    return this.serviceRequestService.create(body, request.user);
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
}
