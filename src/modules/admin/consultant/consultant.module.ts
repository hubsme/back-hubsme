import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { UserModule } from '../user/user.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [UserModule, WhatsappModule, EmailModule],
  controllers: [ConsultantController],
  providers: [ConsultantService, ConsultantRepository, PymeRepository],
  exports: [ConsultantService],
})
export class ConsultantModule {}
