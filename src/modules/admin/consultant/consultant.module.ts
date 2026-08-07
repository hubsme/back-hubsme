import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { UserModule } from '../user/user.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../email/email.module';
import { ConsultantAdminController } from './consultant-admin.controller';
import { ConsultantMercadoPagoAccountRepository } from '@repositories/consultant-mercado-pago-account.repository';
import { MeetingRepository } from '@repositories/meeting.repository';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';

@Module({
  imports: [AdminAuthModule, UserModule, WhatsappModule, EmailModule],
  controllers: [ConsultantAdminController, ConsultantController],
  providers: [
    ConsultantService,
    ConsultantRepository,
    PymeRepository,
    ConsultantMercadoPagoAccountRepository,
    MeetingRepository,
    DiagnosticRepository,
  ],
  exports: [ConsultantService],
})
export class ConsultantModule {}
