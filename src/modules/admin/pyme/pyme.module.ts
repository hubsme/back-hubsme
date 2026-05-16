import { Module } from '@nestjs/common';
import { PymeController } from './pyme.controller';
import { PymeService } from './pyme.service';
import { PymeRepository } from '@repositories/pyme.repository';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';

@Module({
  controllers: [PymeController],
  providers: [PymeService, PymeRepository, PymeConsultantMatchRepository, PymeConsultantMessageRepository],
  exports: [PymeService],
})
export class PymeModule {}
