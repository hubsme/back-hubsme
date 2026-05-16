import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PublicConsultantController } from './public-consultant.controller';
import { PymeConsultantMatchRepository } from '@repositories/pyme-consultant-match.repository';
import { PymeConsultantMessageRepository } from '@repositories/pyme-consultant-message.repository';

@Module({
  controllers: [ConsultantController, PublicConsultantController],
  providers: [ConsultantService, ConsultantRepository, PymeConsultantMatchRepository, PymeConsultantMessageRepository],
  exports: [ConsultantService],
})
export class ConsultantModule {}
