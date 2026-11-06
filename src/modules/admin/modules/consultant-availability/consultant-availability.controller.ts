import { ParseIntPipe } from '@nestjs/common';
import { TraceNode } from '@erixcel/traceflow';
import { ConsultantAvailabilityRemoveResultDto } from './dto/remove.dto';
import { ConsultantAvailabilityVisibleMonthResultDto } from './dto/visible-month.dto';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ConsultantAvailabilityService } from '@modules/admin/modules/consultant-availability/consultant-availability.service';
import { ConsultantAvailabilityCreateDto } from '@modules/admin/modules/consultant-availability/dto/create.dto';
import {
  ConsultantAvailabilityListDto,
  ConsultantAvailabilityListFiltersDto,
} from '@modules/admin/modules/consultant-availability/dto/find-all.dto';
import {
  ConsultantAvailabilityMonthDto,
  ConsultantAvailabilityMonthFiltersDto,
} from '@modules/admin/modules/consultant-availability/dto/find-month.dto';
import { ConsultantAvailabilityReplaceMonthDto } from '@modules/admin/modules/consultant-availability/dto/replace-month.dto';
import { ConsultantAvailabilityResultDto } from '@modules/admin/modules/consultant-availability/dto/find-one.dto';
import { ConsultantAvailabilityUpdateDto } from '@modules/admin/modules/consultant-availability/dto/update.dto';

@ApiTags('consultant-availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/consultant-availability')
export class ConsultantAvailabilityController {
  constructor(private readonly availabilityService: ConsultantAvailabilityService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get consultant availability months paginated' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: ConsultantAvailabilityListFiltersDto) {
    return this.availabilityService.findAllPaginated(filters);
  }

  @Get('find-month')
  @ApiOperation({ summary: 'Get consultant availability for a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityMonthDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findMonth', type: 'controller' })
  findMonth(@Query() filters: ConsultantAvailabilityMonthFiltersDto) {
    return this.availabilityService.findMonth(filters);
  }

  @Get('visible-month')
  @ApiOperation({ summary: 'Get consultant availability visible for PYMES in a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityVisibleMonthResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'visibleMonth', type: 'controller' })
  visibleMonth(@Query() filters: ConsultantAvailabilityMonthFiltersDto) {
    return this.availabilityService.findVisibleMonth(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant availability month by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.findOne(id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a consultant availability month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'create', type: 'controller' })
  create(@Body() createDto: ConsultantAvailabilityCreateDto) {
    return this.availabilityService.create(createDto);
  }

  @Post('replace-month')
  @ApiOperation({ summary: 'Replace consultant availability for a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityMonthDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'replaceMonth', type: 'controller' })
  replaceMonth(@Body() replaceMonthDto: ConsultantAvailabilityReplaceMonthDto) {
    return this.availabilityService.replaceMonth(replaceMonthDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant availability month' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'update', type: 'controller' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: ConsultantAvailabilityUpdateDto) {
    return this.availabilityService.update(id, updateDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant availability month' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityRemoveResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'remove', type: 'controller' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.delete(id);
  }
}
