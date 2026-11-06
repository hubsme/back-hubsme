import { Module } from '@nestjs/common';
import { IdentityVerificationController } from '@modules/admin/modules/identity-verification/identity-verification.controller';
import { IdentityVerificationService } from '@modules/admin/modules/identity-verification/identity-verification.service';

@Module({
  controllers: [IdentityVerificationController],
  providers: [IdentityVerificationService],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
