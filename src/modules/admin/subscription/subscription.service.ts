import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionRepository } from '@repositories/subscription.repository';
import { SubscriptionListFiltersDto } from './dto/subscription-list.dto';
import { SubscriptionUpsertDto } from './dto/subscription-upsert.dto';

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  getPlans() {
    return [
      {
        id: 'free',
        name: 'Gratuito',
        price: 0,
        description: 'Para explorar la plataforma con una cartera pequena.',
        features: ['1 cliente activo', 'Diagnostico limitado', 'Tablero basico'],
      },
      {
        id: 'basic',
        name: 'Basico',
        price: 29,
        description: 'Para consultores independientes con flujo inicial.',
        features: ['Hasta 5 clientes', 'Diagnostico completo', '3 actas mensuales'],
      },
      {
        id: 'pro',
        name: 'Profesional',
        price: 79,
        description: 'Para consultores con cartera activa.',
        features: ['Clientes ilimitados', 'Actas ilimitadas', 'Analitica de cartera'],
      },
      {
        id: 'expert',
        name: 'Experto',
        price: 149,
        description: 'Para agencias y consultores senior.',
        features: ['API de integracion', 'Soporte prioritario', 'Acompanamiento estrategico'],
      },
    ];
  }

  async findAllPaginated(filters: SubscriptionListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.subscriptionRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const subscription = await this.subscriptionRepository.findOne(id);
    if (!subscription) throw new NotFoundException(`Subscription with ID ${id} not found`);
    return subscription;
  }

  async findByUserId(userId: number) {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) throw new NotFoundException(`Subscription for user ID ${userId} not found`);
    return subscription;
  }

  async upsert(data: SubscriptionUpsertDto) {
    const existingSubscription = await this.subscriptionRepository.findByUserId(data.userId);
    const payload = {
      userId: data.userId,
      plan: data.plan,
      status: data.status ?? 'active',
      expiresAt: data.expiresAt,
    };

    if (existingSubscription) {
      return this.subscriptionRepository.update(existingSubscription.id, payload);
    }

    return this.subscriptionRepository.create(payload);
  }
}
