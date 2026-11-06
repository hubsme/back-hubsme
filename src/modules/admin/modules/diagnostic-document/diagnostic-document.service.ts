import { Trace } from '@erixcel/traceflow';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DiagnosticDocumentQuery } from '@queries/diagnostic-document/diagnostic-document.query';

import { DiagnosticDocumentListFiltersDto } from '@modules/admin/modules/diagnostic-document/dto/find-all.dto';
import { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';

// Gestiona los documentos de diagnóstico.
@Trace({ name: 'diagnostic-document', type: 'service' })
@Injectable()
export class DiagnosticDocumentService {
  constructor(private readonly diagnosticDocumentQuery: DiagnosticDocumentQuery) {}

  async findAllPaginated(filters: DiagnosticDocumentListFiltersDto, currentUser?: AuthenticatedUser) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const scopedFilters =
      currentUser?.role === 'pyme' ? { ...filters, pymeId: this.requirePymeId(currentUser) } : filters;
    const { data, total } = await this.diagnosticDocumentQuery.findAllPaginated(page, limit, scopedFilters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const document = await this.diagnosticDocumentQuery.findOne(id);
    if (!document) throw new NotFoundException(`Diagnostic document with ID ${id} not found`);
    return document;
  }

  async findOneForUser(id: number, currentUser: AuthenticatedUser) {
    const document = await this.findOne(id);
    if (currentUser.role === 'pyme' && document.pymeId !== this.requirePymeId(currentUser)) {
      throw new ForbiddenException('No tienes acceso a este documento');
    }
    return document;
  }

  createMany(data: Parameters<DiagnosticDocumentQuery['create']>[0][]) {
    return this.diagnosticDocumentQuery.createMany(data);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.diagnosticDocumentQuery.delete(id);
  }

  async deleteForUser(id: number, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'pyme' && currentUser.membershipRole !== 'owner') {
      throw new ForbiddenException('Tu acceso a la empresa es de solo lectura');
    }
    await this.findOneForUser(id, currentUser);
    return this.diagnosticDocumentQuery.delete(id);
  }

  private requirePymeId(currentUser: AuthenticatedUser) {
    if (!currentUser.pymeId) throw new ForbiddenException('No tienes una empresa asociada');
    return currentUser.pymeId;
  }
}
