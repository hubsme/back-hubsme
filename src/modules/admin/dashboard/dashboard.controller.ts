import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@core/dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/jwt-auth.guard';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary for admin, PYME or consultant' })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 400, type: HttpErrorDto })
  summary(@Query() filters: DashboardFilterDto) {
    return this.dashboardService.summary(filters);
  }
}
