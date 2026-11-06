import { TraceNode } from '@erixcel/traceflow';
import { PymeAdminDiagnosticsResultDto } from './dto/diagnostics.dto';
import { PymeAdminFindOneResultDto } from './dto/find-one.dto';
import { PymeAdminFindAllResultDto } from './dto/find-all.dto';
import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import { PymeListDto, PymeListFiltersDto } from '@modules/admin/modules/pyme/dto/find-all.dto';
import { PymeResultDto } from '@modules/admin/modules/pyme/dto/find-one.dto';
import { PymeService } from '@modules/admin/modules/pyme/pyme.service';
import { PaginationFiltersDto } from '@dto/pagination.dto';
import { DiagnosticListDto } from '@modules/admin/modules/diagnostic/dto/find-all.dto';

@ApiTags('pymeAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/pyme')
export class PymeAdminController {
  constructor(private readonly pymeService: PymeService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List PYMEs for the internal admin panel' })
  @ApiResponse({ status: 200, type: PymeAdminFindAllResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: PymeListFiltersDto) {
    return this.pymeService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a PYME profile for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeAdminFindOneResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findOne', type: 'controller' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pymeService.findOne(id);
  }

  @Get(':id/diagnostics')
  @ApiOperation({ summary: 'List AI diagnostics for a PYME in the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: PymeAdminDiagnosticsResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @ApiResponse({ status: 401, type: HttpErrorDto })
  @ApiResponse({ status: 404, type: HttpErrorDto })
  @TraceNode({ name: 'diagnostics', type: 'controller' })
  diagnostics(@Param('id', ParseIntPipe) id: number, @Query() filters: PaginationFiltersDto) {
    return this.pymeService.findDiagnosticsForAdmin(id, filters);
  }
}
