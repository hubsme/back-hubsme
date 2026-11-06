import { SERVICE_REQUEST_CATEGORY_OPTIONS } from '@modules/admin/modules/service-request/dto/create.dto';
import { ConsultantServiceOfferJoinQuery } from '@queries/consultant-service-offer/consultant-service-offer-join.query';
import { ConsultantServiceOfferQuery } from '@queries/consultant-service-offer/consultant-service-offer.query';
import { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';

import { Trace } from '@erixcel/traceflow';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { ConsultantServiceOfferCreateDto } from '@modules/admin/modules/consultant-service-offer/dto/create.dto';
import { ConsultantServiceOfferListFiltersDto } from '@modules/admin/modules/consultant-service-offer/dto/find-all.dto';
import { ConsultantServiceOfferUpdateDto } from '@modules/admin/modules/consultant-service-offer/dto/update.dto';
import type { AuthenticatedUser } from '@modules/auth/types/authenticated-user.type';

// Gestiona el catálogo de servicios de los consultores.
@Trace({ name: 'consultant-service-offer', type: 'service' })
@Injectable()
export class ConsultantServiceOfferService {
  constructor(
    private readonly consultantServiceOfferJoinQuery: ConsultantServiceOfferJoinQuery,
    private readonly consultantJoinQuery: ConsultantJoinQuery,
    private readonly consultantServiceOfferQuery: ConsultantServiceOfferQuery,
  ) {}

  async findCatalog(filters: ConsultantServiceOfferListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 9, 20);
    const { data, total } = await this.consultantServiceOfferJoinQuery.findAllPaginated(page, limit, {
      search: filters.search,
      category: filters.category,
      subcategory: filters.subcategory,
      publicCatalog: true,
    });
    return this.paginated(data, total, page, limit);
  }

  async findMine(filters: ConsultantServiceOfferListFiltersDto, currentUser: AuthenticatedUser) {
    this.assertConsultant(currentUser);
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 9, 20);
    const { data, total } = await this.consultantServiceOfferJoinQuery.findAllPaginated(page, limit, {
      consultantId: currentUser.id,
      search: filters.search,
      category: filters.category,
      subcategory: filters.subcategory,
      isActive: filters.isActive === undefined ? undefined : filters.isActive === 'true',
    });
    return this.paginated(data, total, page, limit);
  }

  async findOne(id: number, currentUser: AuthenticatedUser) {
    const offer = await this.consultantServiceOfferJoinQuery.findOne(id);
    if (!offer || (!offer.isActive && offer.consultantId !== currentUser.id)) {
      throw new NotFoundException('El servicio publicado no existe');
    }
    return offer;
  }

  async create(data: ConsultantServiceOfferCreateDto, currentUser: AuthenticatedUser) {
    this.assertConsultant(currentUser);
    const consultant = await this.consultantJoinQuery.findByUserId(currentUser.id);
    if (!consultant) throw new NotFoundException('Completa tu perfil de consultor antes de publicar');
    this.assertSubcategory(data.category, data.subcategory);

    return this.createOffer({
      consultantId: currentUser.id,
      ...this.clean(data),
      price: data.price.toFixed(2),
      currency: process.env.MERCADO_PAGO_CURRENCY ?? 'PEN',
      isActive: true,
    });
  }

  async update(id: number, data: ConsultantServiceOfferUpdateDto, currentUser: AuthenticatedUser) {
    this.assertConsultant(currentUser);
    const current = await this.findOwned(id, currentUser.id);
    const category = data.category ?? current.category;
    const subcategory = data.subcategory ?? current.subcategory;
    this.assertSubcategory(category, subcategory);

    return this.updateOffer(id, {
      ...this.clean(data),
      price: data.price === undefined ? undefined : data.price.toFixed(2),
    });
  }

  async setActive(id: number, isActive: boolean, currentUser: AuthenticatedUser) {
    this.assertConsultant(currentUser);
    await this.findOwned(id, currentUser.id);
    return this.updateOffer(id, { isActive });
  }

  async delete(id: number, currentUser: AuthenticatedUser) {
    this.assertConsultant(currentUser);
    const offer = await this.findOwned(id, currentUser.id);
    await this.consultantServiceOfferQuery.delete(id);
    return { ...offer, isActive: false, updatedAt: new Date() };
  }

  private async findOwned(id: number, consultantId: number) {
    const offer = await this.consultantServiceOfferJoinQuery.findOne(id);
    if (!offer) throw new NotFoundException('El servicio publicado no existe');
    if (offer.consultantId !== consultantId) {
      throw new ForbiddenException('No puedes modificar una publicación de otro consultor');
    }
    return offer;
  }

  private assertConsultant(user: AuthenticatedUser) {
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

  private async createOffer(data: Parameters<ConsultantServiceOfferQuery['create']>[0]) {
    const created = await this.consultantServiceOfferQuery.create(data);
    return created ? this.consultantServiceOfferJoinQuery.findOne(created.id) : undefined;
  }
  private async updateOffer(id: number, data: Partial<Parameters<ConsultantServiceOfferQuery['create']>[0]>) {
    const updated = await this.consultantServiceOfferQuery.update(id, data);
    return updated ? this.consultantServiceOfferJoinQuery.findOne(updated.id) : undefined;
  }
}
