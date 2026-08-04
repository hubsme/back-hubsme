import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/admin/user/user.module';
import { PymeModule } from './modules/admin/pyme/pyme.module';
import { ConsultantModule } from './modules/admin/consultant/consultant.module';
import { MeetingModule } from './modules/admin/meeting/meeting.module';
import { TaskModule } from './modules/admin/task/task.module';
import { DiagnosticModule } from './modules/admin/diagnostic/diagnostic.module';
import { DiagnosticDocumentModule } from './modules/admin/diagnostic-document/diagnostic-document.module';
import { SubscriptionModule } from './modules/admin/subscription/subscription.module';
import { DashboardModule } from './modules/admin/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { AiModule } from './modules/admin/ai/ai.module';
import { ConsultantAvailabilityModule } from './modules/admin/consultant-availability/consultant-availability.module';
import { ConsultantGoogleCalendarModule } from './modules/admin/consultant-google-calendar/consultant-google-calendar.module';
import { MercadoPagoModule } from './modules/admin/mercado-pago/mercado-pago.module';
import { EmailModule } from './modules/admin/email/email.module';
import { WhatsappModule } from './modules/admin/whatsapp/whatsapp.module';
import { PublicConsultantModule } from './modules/public/consultant/public-consultant.module';
import { AdminAuthModule } from './modules/admin/admin-auth/admin-auth.module';
import { PromotionCodeModule } from './modules/admin/promotion-code/promotion-code.module';
import { IdentityVerificationModule } from './modules/admin/identity-verification/identity-verification.module';
import { FeedbackModule } from './modules/admin/feedback/feedback.module';
import { ServiceRequestModule } from './modules/admin/service-request/service-request.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PymeModule,
    ConsultantModule,
    MeetingModule,
    TaskModule,
    DiagnosticModule,
    DiagnosticDocumentModule,
    SubscriptionModule,
    DashboardModule,
    StorageModule,
    AiModule,
    ConsultantAvailabilityModule,
    ConsultantGoogleCalendarModule,
    MercadoPagoModule,
    EmailModule,
    WhatsappModule,
    PublicConsultantModule,
    AdminAuthModule,
    PromotionCodeModule,
    IdentityVerificationModule,
    FeedbackModule,
    ServiceRequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
