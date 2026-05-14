import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConsultantListDto, ConsultantListFiltersDto } from './dto/consultant-list.dto';
import { ConsultantService } from './consultant.service';

@ApiTags('publicConsultant')
@Controller('public/consultant')
export class PublicConsultantController {
  constructor(private readonly consultantService: ConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get public active consultants for landing' })
  @ApiResponse({ status: 200, type: ConsultantListDto })
  findAll(@Query() filters: ConsultantListFiltersDto) {
    return this.consultantService.findAllPaginated({
      ...filters,
      active: 'true',
      validated: filters.validated ?? 'true',
    });
  }
}
