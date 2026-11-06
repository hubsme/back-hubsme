import { Module } from '@nestjs/common';
import { StorageController } from '@modules/storage/storage.controller';
import { StorageService } from '@modules/storage/storage.service';

@Module({
  controllers: [StorageController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
