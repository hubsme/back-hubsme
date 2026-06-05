import { Injectable, NotFoundException } from '@nestjs/common';
import { DiagnosticDocumentRepository } from '@repositories/diagnostic-document.repository';
import { DiagnosticDocumentDTO } from '@db/tables/diagnostic-document.table';
import { DiagnosticDocumentListFiltersDto } from './dto/diagnostic-document-list.dto';

@Injectable()
export class DiagnosticDocumentService {
  constructor(private readonly diagnosticDocumentRepository: DiagnosticDocumentRepository) {}

  async findAllPaginated(filters: DiagnosticDocumentListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.diagnosticDocumentRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const document = await this.diagnosticDocumentRepository.findOne(id);
    if (!document) throw new NotFoundException(`Diagnostic document with ID ${id} not found`);
    return document;
  }

  createMany(data: DiagnosticDocumentDTO[]) {
    return this.diagnosticDocumentRepository.createMany(data);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.diagnosticDocumentRepository.delete(id);
  }
}
