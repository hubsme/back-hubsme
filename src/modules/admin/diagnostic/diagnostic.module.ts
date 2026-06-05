import { Module } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { DiagnosticDocumentModule } from '../diagnostic-document/diagnostic-document.module';
import { PowerAutomateModule } from '../powerautomate/powerautomate.module';

@Module({
  imports: [DiagnosticDocumentModule, PowerAutomateModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticRepository],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
