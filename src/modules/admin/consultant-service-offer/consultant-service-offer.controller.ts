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
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import {
  ConsultantServiceOfferActiveDto,
  ConsultantServiceOfferCreateDto,
  ConsultantServiceOfferListDto,
  ConsultantServiceOfferListFiltersDto,
  ConsultantServiceOfferResultDto,
  ConsultantServiceOfferUpdateDto,
} from './dto/consultant-service-offer.dto';
import { ConsultantServiceOfferService } from './consultant-service-offer.service';

type AuthenticatedRequest = { user: User };

@ApiTags('serviceOffer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/service-offer')
export class ServiceOfferController {
  constructor(private readonly service: ConsultantServiceOfferService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List active consultant services available to PYMEs' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferListDto })
  findAll(@Query() filters: ConsultantServiceOfferListFiltersDto) {
    return this.service.findCatalog(filters);
  }

  @Get('find-mine')
  @ApiOperation({ summary: 'List services published by the authenticated consultant' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferListDto })
  findMine(@Query() filters: ConsultantServiceOfferListFiltersDto, @Request() request: AuthenticatedRequest) {
    return this.service.findMine(filters, request.user);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant service offer' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.service.findOne(id, request.user);
  }

  @Post('create')
  @ApiOperation({ summary: 'Publish a consultant service' })
  @ApiResponse({ status: 201, type: ConsultantServiceOfferResultDto })
  create(@Body() body: ConsultantServiceOfferCreateDto, @Request() request: AuthenticatedRequest) {
    return this.service.create(body, request.user);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant service publication' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConsultantServiceOfferUpdateDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.update(id, body, request.user);
  }

  @Patch('active/:id')
  @ApiOperation({ summary: 'Activate or pause a consultant service publication' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  setActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ConsultantServiceOfferActiveDto,
    @Request() request: AuthenticatedRequest,
  ) {
    return this.service.setActive(id, body.isActive, request.user);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Delete a consultant service publication' })
  @ApiResponse({ status: 200, type: ConsultantServiceOfferResultDto })
  remove(@Param('id', ParseIntPipe) id: number, @Request() request: AuthenticatedRequest) {
    return this.service.delete(id, request.user);
  }
}
