import { Module } from '@nestjs/common';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ConsultantRepository } from '@repositories/consultant.repository';

@Module({
  controllers: [ConsultantController],
  providers: [ConsultantService, ConsultantRepository],
  exports: [ConsultantService],
})
export class ConsultantModule {}
