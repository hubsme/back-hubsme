import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { PymeConsultantMatchCreateDto } from './dto/pyme-consultant-match-create.dto';
import { PymeConsultantMatchListDto, PymeConsultantMatchListFiltersDto } from './dto/pyme-consultant-match-list.dto';
import { PymeConsultantMatchResultDto } from './dto/pyme-consultant-match-result.dto';
import { PymeConsultantMatchUpdateDto } from './dto/pyme-consultant-match-update.dto';
import { PymeConsultantMatchService } from './pyme-consultant-match.service';

@ApiTags('pymeConsultantMatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/pyme-consultant-match')
export class PymeConsultantMatchController {
  constructor(private readonly matchService: PymeConsultantMatchService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get all PYME and consultant matches paginated' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeConsultantMatchListFiltersDto) {
    return this.matchService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME and consultant match by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.matchService.findOne(+id);
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a PYME and consultant match' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  create(@Body() createMatchDto: PymeConsultantMatchCreateDto) {
    return this.matchService.create(createMatchDto);
  }

  @Patch('update/:id')
  @ApiOperation({ summary: 'Update a PYME and consultant match' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  update(@Param('id') id: string, @Body() updateMatchDto: PymeConsultantMatchUpdateDto) {
    return this.matchService.update(+id, updateMatchDto);
  }

  @Delete('delete/:id')
  @ApiOperation({ summary: 'Soft-delete a PYME and consultant match' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeConsultantMatchResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  remove(@Param('id') id: string) {
    return this.matchService.delete(+id);
  }
}
