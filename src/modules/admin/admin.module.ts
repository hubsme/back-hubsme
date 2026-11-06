import { Module } from '@nestjs/common';
import { UserModule } from '@modules/admin/modules/user/user.module';
import { PymeModule } from '@modules/admin/modules/pyme/pyme.module';
import { ConsultantModule } from '@modules/admin/modules/consultant/consultant.module';
import { MeetingModule } from '@modules/admin/modules/meeting/meeting.module';
import { TaskModule } from '@modules/admin/modules/task/task.module';
import { DiagnosticModule } from '@modules/admin/modules/diagnostic/diagnostic.module';
import { DiagnosticDocumentModule } from '@modules/admin/modules/diagnostic-document/diagnostic-document.module';
import { SubscriptionModule } from '@modules/admin/modules/subscription/subscription.module';
import { DashboardModule } from '@modules/admin/modules/dashboard/dashboard.module';
import { AiModule } from '@modules/admin/modules/ai/ai.module';
import { ConsultantAvailabilityModule } from '@modules/admin/modules/consultant-availability/consultant-availability.module';
import { ConsultantGoogleCalendarModule } from '@modules/admin/modules/consultant-google-calendar/consultant-google-calendar.module';
import { MercadoPagoModule } from '@modules/admin/modules/mercado-pago/mercado-pago.module';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { WhatsappModule } from '@modules/admin/modules/whatsapp/whatsapp.module';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { PromotionCodeModule } from '@modules/admin/modules/promotion-code/promotion-code.module';
import { IdentityVerificationModule } from '@modules/admin/modules/identity-verification/identity-verification.module';
import { FeedbackModule } from '@modules/admin/modules/feedback/feedback.module';
import { ServiceRequestModule } from '@modules/admin/modules/service-request/service-request.module';
import { ConsultantServiceOfferModule } from '@modules/admin/modules/consultant-service-offer/consultant-service-offer.module';
import { MonnetModule } from '@modules/admin/modules/monnet/monnet.module';

@Module({
  imports: [
    UserModule,
    PymeModule,
    ConsultantModule,
    MeetingModule,
    TaskModule,
    DiagnosticModule,
    DiagnosticDocumentModule,
    SubscriptionModule,
    DashboardModule,
    AiModule,
    ConsultantAvailabilityModule,
    ConsultantGoogleCalendarModule,
    MercadoPagoModule,
    EmailModule,
    WhatsappModule,
    AdminAuthModule,
    PromotionCodeModule,
    IdentityVerificationModule,
    FeedbackModule,
    ServiceRequestModule,
    ConsultantServiceOfferModule,
    MonnetModule,
  ],
})
export class AdminModule {}
