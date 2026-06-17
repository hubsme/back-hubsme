import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ConsultantCreateDto } from './dto/consultant-create.dto';
import { ConsultantListDto, ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantResultDto } from './dto/consultant-result.dto';
import { ConsultantUpdateDto } from './dto/consultant-update.dto';
import { ConsultantService } from './consultant.service';

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
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(+id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a consultant profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Param('userId') userId: string) {
    return this.consultantService.findByUserId(+userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new consultant profile' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createConsultantDto: ConsultantCreateDto) {
    return this.consultantService.create(createConsultantDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateConsultantDto: ConsultantUpdateDto) {
    return this.consultantService.update(+id, updateConsultantDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a consultant profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.consultantService.delete(+id);
  }
}
