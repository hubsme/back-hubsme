import { PublicModule } from '@modules/public/public.module';
import { AdminModule } from '@modules/admin/admin.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [PublicModule, AdminModule, AuthModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
