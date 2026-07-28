import { Module } from '@nestjs/common';
import { DashboardRepository } from '@repositories/dashboard.repository';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
