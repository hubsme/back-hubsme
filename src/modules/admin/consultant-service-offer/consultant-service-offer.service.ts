import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SERVICE_REQUEST_CATEGORY_OPTIONS } from '@db/tables/service-request.table';
import { User } from '@db/tables/user.table';
import { ConsultantRepository } from '@repositories/consultant.repository';
import { ConsultantServiceOfferRepository } from '@repositories/consultant-service-offer.repository';
import {
  ConsultantServiceOfferCreateDto,
  ConsultantServiceOfferListFiltersDto,
  ConsultantServiceOfferUpdateDto,
} from './dto/consultant-service-offer.dto';

@Injectable()
export class ConsultantServiceOfferService {
  constructor(
    private readonly repository: ConsultantServiceOfferRepository,
    private readonly consultantRepository: ConsultantRepository,
  ) {}

  async findCatalog(filters: ConsultantServiceOfferListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 9, 20);
    const { data, total } = await this.repository.findAllPaginated(page, limit, {
      search: filters.search,
      category: filters.category,
      subcategory: filters.subcategory,
      publicCatalog: true,
    });
    return this.paginated(data, total, page, limit);
  }

  async findMine(filters: ConsultantServiceOfferListFiltersDto, currentUser: User) {
    this.assertConsultant(currentUser);
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 9, 20);
    const { data, total } = await this.repository.findAllPaginated(page, limit, {
      consultantId: currentUser.id,
      search: filters.search,
      category: filters.category,
      subcategory: filters.subcategory,
      isActive: filters.isActive === undefined ? undefined : filters.isActive === 'true',
    });
    return this.paginated(data, total, page, limit);
  }

  async findOne(id: number, currentUser: User) {
    const offer = await this.repository.findOne(id);
    if (!offer || (!offer.isActive && offer.consultantId !== currentUser.id)) {
      throw new NotFoundException('El servicio publicado no existe');
    }
    return offer;
  }

  async create(data: ConsultantServiceOfferCreateDto, currentUser: User) {
    this.assertConsultant(currentUser);
    const consultant = await this.consultantRepository.findByUserId(currentUser.id);
    if (!consultant) throw new NotFoundException('Completa tu perfil de consultor antes de publicar');
    this.assertSubcategory(data.category, data.subcategory);

    return this.repository.create({
      consultantId: currentUser.id,
      ...this.clean(data),
      price: data.price.toFixed(2),
      currency: process.env.MERCADO_PAGO_CURRENCY ?? 'PEN',
      isActive: true,
    });
  }

  async update(id: number, data: ConsultantServiceOfferUpdateDto, currentUser: User) {
    this.assertConsultant(currentUser);
    const current = await this.findOwned(id, currentUser.id);
    const category = data.category ?? current.category;
    const subcategory = data.subcategory ?? current.subcategory;
    this.assertSubcategory(category, subcategory);

    return this.repository.update(id, {
      ...this.clean(data),
      price: data.price === undefined ? undefined : data.price.toFixed(2),
    });
  }

  async setActive(id: number, isActive: boolean, currentUser: User) {
    this.assertConsultant(currentUser);
    await this.findOwned(id, currentUser.id);
    return this.repository.update(id, { isActive });
  }

  async delete(id: number, currentUser: User) {
    this.assertConsultant(currentUser);
    const offer = await this.findOwned(id, currentUser.id);
    await this.repository.delete(id);
    return { ...offer, isActive: false, updatedAt: new Date() };
  }

  private async findOwned(id: number, consultantId: number) {
    const offer = await this.repository.findOne(id);
    if (!offer) throw new NotFoundException('El servicio publicado no existe');
    if (offer.consultantId !== consultantId) {
      throw new ForbiddenException('No puedes modificar una publicación de otro consultor');
    }
    return offer;
  }

  private assertConsultant(user: User) {
    if (user.role !== 'consultor') {
      throw new ForbiddenException('Solo los consultores pueden administrar servicios publicados');
    }
  }

  private assertSubcategory(category: ConsultantServiceOfferCreateDto['category'], subcategory: string) {
    const option = SERVICE_REQUEST_CATEGORY_OPTIONS.find((item) => item.category === category);
    if (!option?.subcategories.some((item) => item === subcategory.trim())) {
      throw new BadRequestException(['La subcategoría no pertenece a la categoría seleccionada']);
    }
  }

  private clean(data: ConsultantServiceOfferUpdateDto) {
    return {
      title: data.title?.trim(),
      category: data.category,
      subcategory: data.subcategory?.trim(),
      description: data.description?.trim(),
      expectedOutcome: data.expectedOutcome?.trim(),
      requirements: data.requirements?.trim(),
      deliverables: data.deliverables
        ? [...new Set(data.deliverables.map((item) => item.trim()).filter(Boolean))]
        : undefined,
      exclusions: data.exclusions === undefined ? undefined : data.exclusions.trim() || null,
      estimatedDurationDays: data.estimatedDurationDays,
      workModality: data.workModality,
      workMethod: data.workMethod?.trim(),
      pricePeriod: data.pricePeriod,
    };
  }

  private paginated<T>(data: T[], total: number, page: number, limit: number) {
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalPages > 0,
      },
    };
  }
}
