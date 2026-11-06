import { ConsultantServiceOfferJoinQuery } from '@queries/consultant-service-offer/consultant-service-offer-join.query';
import { ConsultantServiceOfferQuery } from '@queries/consultant-service-offer/consultant-service-offer.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';
import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { Module } from '@nestjs/common';
import { ConsultantServiceOfferController } from '@modules/admin/modules/consultant-service-offer/consultant-service-offer.controller';
import { ConsultantServiceOfferService } from '@modules/admin/modules/consultant-service-offer/consultant-service-offer.service';

@Module({
  controllers: [ConsultantServiceOfferController],
  providers: [
    ConsultantServiceOfferService,
    ConsultantServiceOfferJoinQuery,
    ConsultantServiceOfferQuery,
    ConsultantJoinQuery,
    ConsultantQuery,
  ],
})
export class ConsultantServiceOfferModule {}
