import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from '@modules/admin/modules/admin-auth/admin-auth.controller';
import { AdminAuthGuard } from '@modules/admin/modules/admin-auth/guards/admin-auth.guard';
import { AdminAuthService } from '@modules/admin/modules/admin-auth/admin-auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard],
  exports: [AdminAuthGuard, JwtModule],
})
export class AdminAuthModule {}
