import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { User } from '@db/tables/user.table';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { ConsultantListDto } from '@modules/admin/consultant/dto/consultant-list.dto';
import { PymeCreateDto } from './dto/pyme-create.dto';
import { PymeListDto, PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeMeetingConsultantsFiltersDto } from './dto/pyme-meeting-consultants.dto';
import { PymeResultDto } from './dto/pyme-result.dto';
import { PymeUpdateDto } from './dto/pyme-update.dto';
import { PymeService } from './pyme.service';

type AuthenticatedRequest = { user: User };

@ApiTags('pyme')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pyme')
export class PymeController {
  constructor(private readonly pymeService: PymeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all PYMEs paginated' })
  @ApiResponse({ status: 200, type: PymeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('meeting-consultants')
  @ApiOperation({ summary: 'Get consultants with at least one meeting with current PYME' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  meetingConsultants(@Request() req: AuthenticatedRequest, @Query() filters: PymeMeetingConsultantsFiltersDto) {
    return this.pymeService.findMeetingConsultants(req.user.id, filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.pymeService.findOne(+id);
  }

  @Get('find-by-user/:userId')
  @ApiOperation({ summary: 'Get a PYME profile by user ID' })
  @ApiParam({ name: 'userId', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findByUser(@Param('userId') userId: string) {
    return this.pymeService.findByUserId(+userId);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new PYME profile' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createPymeDto: PymeCreateDto) {
    return this.pymeService.create(createPymeDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updatePymeDto: PymeUpdateDto) {
    return this.pymeService.update(+id, updatePymeDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a PYME profile' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.pymeService.delete(+id);
  }
}
