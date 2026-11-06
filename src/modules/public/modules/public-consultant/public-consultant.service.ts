import { ConsultantQuery } from '@queries/consultant/consultant.query';
import { Trace } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { PublicConsultantListFiltersDto } from '@modules/public/modules/public-consultant/dto/find-all.dto';

// Prepara el catálogo público de consultores.
@Trace({ name: 'public-consultant', type: 'service' })
@Injectable()
export class PublicConsultantService {
  constructor(private readonly consultantQuery: ConsultantQuery) {}

  async findAllPaginated(filters: PublicConsultantListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.consultantQuery.findAllPaginated(page, limit, {
      ...filters,
      active: 'true',
      validated: filters.validated ?? 'true',
    });
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }
}
