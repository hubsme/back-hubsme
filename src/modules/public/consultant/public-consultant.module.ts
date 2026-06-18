import { Module } from '@nestjs/common';
import { PublicConsultantController } from './public-consultant.controller';
import { PublicConsultantService } from './public-consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';

@Module({
  controllers: [PublicConsultantController],
  providers: [PublicConsultantService, ConsultantRepository],
  exports: [PublicConsultantService],
})
export class PublicConsultantModule {}
