import { Module } from '@nestjs/common';
import { PymeController } from './pyme.controller';
import { PymeService } from './pyme.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../email/email.module';
import { PymeAdminController } from './pyme-admin.controller';

@Module({
  imports: [AdminAuthModule, WhatsappModule, EmailModule],
  controllers: [PymeAdminController, PymeController],
  providers: [PymeService, PymeRepository, ConsultantRepository],
  exports: [PymeService],
})
export class PymeModule {}
