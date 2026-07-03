import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionRepository } from '@repositories/subscription.repository';
import { SubscriptionPlanRepository } from '@repositories/subscription-plan.repository';
import { SubscriptionListFiltersDto } from './dto/subscription-list.dto';
import { SubscriptionUpsertDto } from './dto/subscription-upsert.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly subscriptionPlanRepository: SubscriptionPlanRepository,
  ) {}

  async getPlans() {
    return this.subscriptionPlanRepository.findAll();
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
    if (data.plan !== 'free' && data.status === 'active') {
      throw new BadRequestException(['Los planes de pago requieren cobro directo con pasarela Mercado Pago']);
    }

    const existingSubscription = await this.subscriptionRepository.findByUserId(data.userId);
    const payload = {
      userId: data.userId,
      plan: data.plan,
      status: (data.status ?? 'active') as 'active' | 'paused' | 'cancelled' | 'expired',
      expiresAt: data.expiresAt,
    };

    if (existingSubscription) {
      return this.subscriptionRepository.update(existingSubscription.id, payload);
    }

    return this.subscriptionRepository.create(payload);
  }

  async createCheckout(userId: number, planId: string) {
    const plan = await this.subscriptionPlanRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan ${planId} no encontrado`);
    }

    if (planId === 'free') {
      throw new BadRequestException(['El plan gratuito no requiere pago']);
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new BadRequestException(['MERCADO_PAGO_ACCESS_TOKEN no configurado']);
    }

    const externalReference = `subscription:${userId}:${plan.id}:${Date.now()}`;
    const webhookBaseUrl = process.env.MERCADO_PAGO_WEBHOOK_URL || `${process.env.BACKEND_URL || process.env.API_URL}/admin/mercado-pago/webhook`;
    const notificationUrl = `${webhookBaseUrl}${webhookBaseUrl.includes('?') ? '&' : '?'}externalReference=${encodeURIComponent(externalReference)}`;

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: externalReference,
            title: `Suscripción Plan ${plan.name} - Hubsme`,
            quantity: 1,
            currency_id: 'PEN',
            unit_price: Number(plan.price),
          },
        ],
        external_reference: externalReference,
        notification_url: notificationUrl,
        metadata: {
          external_reference: externalReference,
          user_id: userId,
          plan_id: plan.id,
        },
      }),
    });

    const preference = await response.json();
    if (!response.ok || !preference.id) {
      throw new BadRequestException([preference.message || 'No se pudo crear el checkout de Mercado Pago']);
    }

    return {
      initPoint: preference.init_point as string,
      sandboxInitPoint: preference.sandbox_init_point as string,
    };
  }

  async activatePlan(userId: number, planId: string) {
    const existing = await this.subscriptionRepository.findByUserId(userId);
    const start = new Date();
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 1);

    const payload = {
      userId,
      plan: planId,
      status: 'active' as const,
      startedAt: start,
      expiresAt: expires,
    };

    if (existing) {
      return this.subscriptionRepository.update(existing.id, payload);
    }
    return this.subscriptionRepository.create(payload);
  }
}
