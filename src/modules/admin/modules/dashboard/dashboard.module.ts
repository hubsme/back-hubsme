import { UserJoinQuery } from '@queries/user/user-join.query';
import { TaskQuery } from '@queries/task/task.query';
import { DiagnosticQuery } from '@queries/diagnostic/diagnostic.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { DashboardAlertQuery } from '@queries/dashboard-alert/dashboard-alert.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { Module } from '@nestjs/common';
import { DashboardController } from '@modules/admin/modules/dashboard/dashboard.controller';
import { DashboardService } from '@modules/admin/modules/dashboard/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    UserJoinQuery,
    TaskQuery,
    DiagnosticQuery,
    MeetingQuery,
    DashboardAlertQuery,
    PymeJoinQuery,
    ConsultantJoinQuery,
  ],
})
export class DashboardModule {}
