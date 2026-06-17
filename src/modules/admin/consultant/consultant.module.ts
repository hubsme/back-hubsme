import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PublicConsultantController } from './public-consultant.controller';

@Module({
  controllers: [ConsultantController, PublicConsultantController],
  providers: [ConsultantService, ConsultantRepository],
  exports: [ConsultantService],
})
export class ConsultantModule {}
