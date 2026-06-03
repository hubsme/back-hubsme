import { Module } from '@nestjs/common';
import { PowerAutomateService } from './powerautomate.service';
import { PowerAutomateController } from './powerautomate.controller';

@Module({
  controllers: [PowerAutomateController],
  providers: [PowerAutomateService],
  exports: [PowerAutomateService],
})
export class PowerAutomateModule {}
