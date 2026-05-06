import { Module } from '@nestjs/common';
import { DiagnosticController } from './diagnostic.controller';
import { DiagnosticService } from './diagnostic.service';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { GeminiService } from '@modules/admin/common/gemini.service';

@Module({
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticRepository, GeminiService],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
