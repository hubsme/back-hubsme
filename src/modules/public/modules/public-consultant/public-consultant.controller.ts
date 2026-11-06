import { TraceNode } from '@erixcel/traceflow';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import {
  PublicConsultantListDto,
  PublicConsultantListFiltersDto,
} from '@modules/public/modules/public-consultant/dto/find-all.dto';
import { PublicConsultantService } from '@modules/public/modules/public-consultant/public-consultant.service';

@ApiTags('publicConsultant')
@Controller('public/consultant')
export class PublicConsultantController {
  constructor(private readonly publicConsultantService: PublicConsultantService) {}

  @Get('find-all')
  @ApiOperation({ summary: 'Get public active consultants for landing' })
  @ApiResponse({ status: 200, type: PublicConsultantListDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  @TraceNode({ name: 'findAll', type: 'controller' })
  findAll(@Query() filters: PublicConsultantListFiltersDto) {
    return this.publicConsultantService.findAllPaginated(filters);
  }
}
