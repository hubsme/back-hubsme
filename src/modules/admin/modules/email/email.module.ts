import { Module } from '@nestjs/common';
import { EmailController } from '@modules/admin/modules/email/email.controller';
import { EmailService } from '@modules/admin/modules/email/email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
