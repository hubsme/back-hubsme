import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicConsultantListDto, PublicConsultantListFiltersDto } from './dto/public-consultant-list.dto';
import { PublicConsultantService } from './public-consultant.service';

@ApiTags('publicConsultant')
@Controller('public/consultant')
export class PublicConsultantController {
  constructor(private readonly publicConsultantService: PublicConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get public active consultants for landing' })
  @ApiResponse({ status: 200, type: PublicConsultantListDto })
  findAll(@Query() filters: PublicConsultantListFiltersDto) {
    return this.publicConsultantService.findAllPaginated({
      ...filters,
      active: 'true',
      validated: filters.validated ?? 'true',
    });
  }
}
