import { DiagnosticDocumentQuery } from '@queries/diagnostic-document/diagnostic-document.query';
import { Module } from '@nestjs/common';
import { DiagnosticDocumentController } from '@modules/admin/modules/diagnostic-document/diagnostic-document.controller';
import { DiagnosticDocumentService } from '@modules/admin/modules/diagnostic-document/diagnostic-document.service';

@Module({
  controllers: [DiagnosticDocumentController],
  providers: [DiagnosticDocumentService, DiagnosticDocumentQuery],
  exports: [DiagnosticDocumentService],
})
export class DiagnosticDocumentModule {}
