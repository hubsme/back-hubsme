import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { Module } from '@nestjs/common';
import { PublicConsultantController } from '@modules/public/modules/public-consultant/public-consultant.controller';
import { PublicConsultantService } from '@modules/public/modules/public-consultant/public-consultant.service';

@Module({
  controllers: [PublicConsultantController],
  providers: [PublicConsultantService, ConsultantJoinQuery, ConsultantQuery],
  exports: [PublicConsultantService],
})
export class PublicConsultantModule {}
