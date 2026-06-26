import { Module } from '@nestjs/common';
import { PymeController } from './pyme.controller';
import { PymeService } from './pyme.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [WhatsappModule, EmailModule],
  controllers: [PymeController],
  providers: [PymeService, PymeRepository, ConsultantRepository],
  exports: [PymeService],
})
export class PymeModule {}
