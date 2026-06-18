import { Injectable } from '@nestjs/common';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { PublicConsultantListFiltersDto } from './dto/public-consultant-list.dto';

@Injectable()
export class PublicConsultantService {
  constructor(private readonly consultantRepository: ConsultantRepository) {}

  async findAllPaginated(filters: PublicConsultantListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.consultantRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }
}
