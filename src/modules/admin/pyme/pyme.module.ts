import { Module } from '@nestjs/common';
import { PymeController } from './pyme.controller';
import { PymeService } from './pyme.service';
import { PymeRepository } from '@repositories/pyme.repository';

@Module({
  controllers: [PymeController],
  providers: [PymeService, PymeRepository],
  exports: [PymeService],
})
export class PymeModule {}
