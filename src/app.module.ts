import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/admin/user/user.module';
import { PymeModule } from './modules/admin/pyme/pyme.module';
import { ConsultantModule } from './modules/admin/consultant/consultant.module';
import { MeetingModule } from './modules/admin/meeting/meeting.module';
import { TaskModule } from './modules/admin/task/task.module';
import { DiagnosticModule } from './modules/admin/diagnostic/diagnostic.module';
import { SubscriptionModule } from './modules/admin/subscription/subscription.module';
import { DashboardModule } from './modules/admin/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
@Module({
  imports: [
    AuthModule,
    UserModule,
    PymeModule,
    ConsultantModule,
    MeetingModule,
    TaskModule,
    DiagnosticModule,
    SubscriptionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
