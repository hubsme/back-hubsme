import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PymeRepository } from '@repositories/pyme.repository';
import { PublicConsultantController } from './public-consultant.controller';

@Module({
  controllers: [ConsultantController, PublicConsultantController],
  providers: [ConsultantService, ConsultantRepository, PymeRepository],
  exports: [ConsultantService],
})
export class ConsultantModule {}
