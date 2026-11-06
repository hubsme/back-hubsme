import { Module } from '@nestjs/common';
import { AdminAuthModule } from '@modules/admin/modules/admin-auth/admin-auth.module';
import { PayinController } from '@modules/admin/modules/monnet/modules/payin/payin.controller';
import { PayinService } from '@modules/admin/modules/monnet/modules/payin/payin.service';

@Module({
  imports: [AdminAuthModule],
  controllers: [PayinController],
  providers: [PayinService],
  exports: [PayinService],
})
export class PayinModule {}
