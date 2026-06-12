import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ConsultantAvailabilityService } from './consultant-availability.service';
import { ConsultantAvailabilityCreateDto } from './dto/consultant-availability-create.dto';
import {
  ConsultantAvailabilityListDto,
  ConsultantAvailabilityListFiltersDto,
  ConsultantAvailabilityMonthDto,
  ConsultantAvailabilityMonthFiltersDto,
} from './dto/consultant-availability-list.dto';
import { ConsultantAvailabilityReplaceMonthDto } from './dto/consultant-availability-replace-month.dto';
import { ConsultantAvailabilityResultDto } from './dto/consultant-availability-result.dto';
import { ConsultantAvailabilityUpdateDto } from './dto/consultant-availability-update.dto';

@ApiTags('consultant-availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/consultant-availability')
export class ConsultantAvailabilityController {
  constructor(private readonly availabilityService: ConsultantAvailabilityService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get consultant availability slots paginated' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: ConsultantAvailabilityListFiltersDto) {
    return this.availabilityService.findAllPaginated(filters);
  }

  @Get('find-month')
  @ApiOperation({ summary: 'Get consultant availability slots for a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityMonthDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findMonth(@Query() filters: ConsultantAvailabilityMonthFiltersDto) {
    return this.availabilityService.findMonth(filters);
  }

  @Get('visible-month')
  @ApiOperation({ summary: 'Get available consultant slots visible for PYMES in a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityMonthDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  visibleMonth(@Query() filters: ConsultantAvailabilityMonthFiltersDto) {
    return this.availabilityService.findVisibleMonth(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant availability slot by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.availabilityService.findOne(+id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a consultant availability slot' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createDto: ConsultantAvailabilityCreateDto) {
    return this.availabilityService.create(createDto);
  }

  @Post('replace-month')
  @ApiOperation({ summary: 'Replace all consultant availability slots for a month' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityMonthDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  replaceMonth(@Body() replaceMonthDto: ConsultantAvailabilityReplaceMonthDto) {
    return this.availabilityService.replaceMonth(replaceMonthDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant availability slot' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateDto: ConsultantAvailabilityUpdateDto) {
    return this.availabilityService.update(+id, updateDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant availability slot' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantAvailabilityResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.availabilityService.delete(+id);
  }
}
