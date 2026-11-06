import { TraceNode } from '@erixcel/traceflow';
import { ServiceOfferRemoveResultDto } from './dto/remove.dto';
import { ServiceOfferFindMineResultDto } from './dto/find-mine.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ConsultantServiceOfferActiveDto } from '@modules/admin/modules/consultant-service-offer/dto/set-active.dto';
import { ConsultantServiceOfferCreateDto } from '@modules/admin/modules/consultant-service-offer/dto/create.dto';
import {
  ConsultantServiceOfferListDto,
  ConsultantServiceOfferListFiltersDto,
} from '@modules/admin/modules/consultant-service-offer/dto/find-all.dto';
import { ConsultantServiceOfferResultDto } from '@modules/admin/modules/consultant-service-offer/dto/find-one.dto';
import { ConsultantServiceOfferUpdateDto } from '@modules/admin/modules/consultant-service-offer/dto/update.dto';
import { ConsultantServiceOfferService } from '@modules/admin/modules/consultant-service-offer/consultant-service-offer.service';

@ApiTags('serviceOffer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/service-offer')
export class ConsultantServiceOfferController {
  constructor(private readonly service: ConsultantServiceOfferService) {}

  @Get('find-all')
  @ApiOperation({
    operationId: 'ServiceOfferController_findAll',
    summary: 'List active consultant services available to PYMEs',
  })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: ConsultantServiceOfferListFiltersDto) {
    return this.service.findCatalog(filters);
  }

  @Get('find-mine')
  @ApiOperation({
    operationId: 'ServiceOfferController_findMine',
    summary: 'List services published by the authenticated consultant',
  })
  @ApiResponse({ status: 200, type: ServiceOfferFindMineResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findMine', type: 'controller' })
  findMine(@Query() filters: ConsultantServiceOfferListFiltersDto, @Request() request: AuthenticatedRequest) {
    return this.service.findMine(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ operationId: 'ServiceOfferController_findOne', summary: 'Get a consultant service offer' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.service.findOne(id, request.user);
  }

  @Post('create')
  @ApiOperation({ operationId: 'ServiceOfferController_create', summary: 'Publish a consultant service' })
  @ApiResponse({ status: 201, type: ConsultantServiceOfferResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Body() body: ConsultantServiceOfferCreateDto, @Request() request: AuthenticatedRequest) {
    return this.service.create(body, request.user);
  }

  @Patch('update/:id')
  @ApiOperation({ operationId: 'ServiceOfferController_update', summary: 'Update a consultant service publication' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConsultantServiceOfferUpdateDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, body, request.user);
  }

  @Patch('active/:id')
  @ApiOperation({
    operationId: 'ServiceOfferController_setActive',
    summary: 'Activate or pause a consultant service publication',
  })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'setActive', type: 'controller' })
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConsultantServiceOfferActiveDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.setActive(id, body.isActive, request.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ operationId: 'ServiceOfferController_remove', summary: 'Delete a consultant service publication' })
  @ApiResponse({ status: 200, type: ServiceOfferRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.service.delete(id, request.user);
  }
}
