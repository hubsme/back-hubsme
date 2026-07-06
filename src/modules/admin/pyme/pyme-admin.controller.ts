import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { PymeListDto, PymeListFiltersDto } from './dto/pyme-list.dto';
import { PymeResultDto } from './dto/pyme-result.dto';
import { PymeService } from './pyme.service';

@ApiTags('pymeAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/pyme')
export class PymeAdminController {
  constructor(private readonly pymeService: PymeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List PYMEs for the internal admin panel' })
  @ApiResponse({ status: 200, type: PymeListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.pymeService.findOne(+id);
  }
}
