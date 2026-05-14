import { Module } from '@nestjs/common';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';
import { PymeConsultantMessageController } from './pyme-consultant-message.controller';
import { PymeConsultantMessageService } from './pyme-consultant-message.service';

@Module({
  controllers: [PymeConsultantMessageController],
  providers: [PymeConsultantMessageService, PymeConsultantMessageRepository, PymeConsultantMatchRepository],
  exports: [PymeConsultantMessageService],
})
export class PymeConsultantMessageModule {}
