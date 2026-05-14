import { Module } from '@nestjs/common';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMatchController } from './pyme-consultant-match.controller';
import { PymeConsultantMatchService } from './pyme-consultant-match.service';

@Module({
  controllers: [PymeConsultantMatchController],
  providers: [PymeConsultantMatchService, PymeConsultantMatchRepository],
  exports: [PymeConsultantMatchService],
})
export class PymeConsultantMatchModule {}
