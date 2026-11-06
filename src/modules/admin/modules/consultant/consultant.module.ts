import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { PymeQuery } from '@queries/pyme/pyme.query';
import { PymeJoinQuery } from '@queries/pyme/pyme-join.query';
import { MeetingQuery } from '@queries/meeting/meeting.query';
import { MeetingJoinQuery } from '@queries/meeting/meeting-join.query';
import { DiagnosticJoinQuery } from '@queries/diagnostic/diagnostic-join.query';
import { DiagnosticQuery } from '@queries/diagnostic/diagnostic.query';
import { Module } from '@nestjs/common';
import { ConsultantController } from '@modules/admin/modules/consultant/consultant.controller';
import { ConsultantService } from '@modules/admin/modules/consultant/consultant.service';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { UserModule } from '@modules/admin/modules/user/user.module';
import { WhatsappModule } from '@modules/admin/modules/whatsapp/whatsapp.module';
import { EmailModule } from '@modules/admin/modules/email/email.module';
import { ConsultantAdminController } from '@modules/admin/modules/consultant/controllers/consultant-admin/consultant-admin.controller';
import { MercadoPagoAccountModule } from '@modules/admin/modules/mercado-pago/modules/mercado-pago-account/mercado-pago-account.module';

@Module({
  imports: [AdminAuthModule, UserModule, WhatsappModule, EmailModule, MercadoPagoAccountModule],
  controllers: [ConsultantAdminController, ConsultantController],
  providers: [
    ConsultantService,
    ConsultantJoinQuery,
    ConsultantQuery,
    PymeQuery,
    PymeJoinQuery,
    MeetingQuery,
    MeetingJoinQuery,
    DiagnosticJoinQuery,
    DiagnosticQuery,
  ],
  exports: [ConsultantService],
})
export class ConsultantModule {}
