import { TraceNode } from '@erixcel/traceflow';
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HttpErrorDto } from '@dto/http-error.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { DashboardFilterDto } from '@modules/admin/modules/dashboard/dto/summary.dto';
import { DashboardResponseDto } from '@modules/admin/modules/dashboard/dto/summary.dto';
import { DashboardService } from '@modules/admin/modules/dashboard/dashboard.service';
import type { AuthenticatedRequest } from '@modules/auth/types/authenticated-user.type';

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
  @TraceNode({ name: 'summary', type: 'controller' })
  summary(@Request() req: AuthenticatedRequest, @Query() filters: DashboardFilterDto) {
    return this.dashboardService.summaryForUser(filters, req.user);
  }
}
