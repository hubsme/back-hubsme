import { Module } from '@nestjs/common';
import { DiagnosticDocumentController } from './diagnostic-document.controller';
import { DiagnosticDocumentService } from './diagnostic-document.service';
import { DiagnosticDocumentRepository } from '@repositories/diagnostic-document.repository';

@Module({
  controllers: [DiagnosticDocumentController],
  providers: [DiagnosticDocumentService, DiagnosticDocumentRepository],
  exports: [DiagnosticDocumentService],
})
export class DiagnosticDocumentModule {}
