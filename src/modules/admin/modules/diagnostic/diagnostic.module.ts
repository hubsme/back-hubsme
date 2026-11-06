import { DiagnosticJoinQuery } from '@queries/diagnostic/diagnostic-join.query';
import { DiagnosticQuery } from '@queries/diagnostic/diagnostic.query';
import { Module } from '@nestjs/common';
import { DiagnosticController } from '@modules/admin/modules/diagnostic/diagnostic.controller';
import { DiagnosticService } from '@modules/admin/modules/diagnostic/diagnostic.service';
import { DiagnosticDocumentModule } from '@modules/admin/modules/diagnostic-document/diagnostic-document.module';
import { AiModule } from '@modules/admin/modules/ai/ai.module';

@Module({
  imports: [DiagnosticDocumentModule, AiModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, DiagnosticJoinQuery, DiagnosticQuery],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
