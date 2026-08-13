import { Module } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantServiceOfferRepository } from '@repositories/consultant-service-offer.repository';
import { ServiceOfferController } from './consultant-service-offer.controller';
import { ConsultantServiceOfferService } from './consultant-service-offer.service';

@Module({
  controllers: [ServiceOfferController],
  providers: [ConsultantServiceOfferService, ConsultantServiceOfferRepository, ConsultantRepository],
})
export class ConsultantServiceOfferModule {}
