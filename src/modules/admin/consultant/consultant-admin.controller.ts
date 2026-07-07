import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { ConsultantListDto, ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantResultDto } from './dto/consultant-result.dto';
import { ConsultantService } from './consultant.service';

@ApiTags('consultantAdmin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/backoffice/consultant')
export class ConsultantAdminController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'List consultants for the internal admin panel' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated(filters);
  }

  @Get('find-one/:id')
  @ApiOperation({ summary: 'Get a consultant profile for the internal admin panel' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, type: ConsultantResultDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  findOne(@Param('id') id: string) {
    return this.consultantService.findOne(+id);
  }
}
