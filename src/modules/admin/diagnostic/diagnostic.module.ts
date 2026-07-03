import { Module } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { DiagnosticDocumentModule } from '../diagnostic-document/diagnostic-document.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [DiagnosticDocumentModule, AiModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticRepository],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
