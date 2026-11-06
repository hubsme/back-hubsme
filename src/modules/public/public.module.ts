import { Module } from '@nestjs/common';
import { PublicConsultantModule } from '@modules/public/modules/public-consultant/public-consultant.module';

@Module({
  imports: [PublicConsultantModule],
})
export class PublicModule {}
