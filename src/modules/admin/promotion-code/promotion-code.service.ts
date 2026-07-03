import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { MercadoPagoPaymentRepository } from '@repositories/mercado-pago-payment.repository';
import { PromotionCodeRepository } from '@repositories/promotion-code.repository';
import { MeetingService } from '../meeting/meeting.service';
import {
  PromotionCodeCreateDto,
  PromotionCodeListFiltersDto,
  PromotionCodeRedeemDto,
  PromotionCodeUpdateDto,
} from './dto/promotion-code.dto';

@Injectable()
export class PromotionCodeService {
  constructor(
    private readonly promotionCodeRepository: PromotionCodeRepository,
    private readonly paymentRepository: MercadoPagoPaymentRepository,
    private readonly meetingService: MeetingService,
  ) {}

  async findAllPaginated(filters: PromotionCodeListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } =
      await this.promotionCodeRepository.findAllPaginated(
        page,
        limit,
        filters.search,
      );
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(data: PromotionCodeCreateDto) {
    this.assertDateRange(data.startsAt, data.expiresAt);

    try {
      return await this.promotionCodeRepository.create({
        code: this.normalizeCode(data.code || this.generateCode()),
        description: data.description?.trim() || null,
        maxRedemptions: data.maxRedemptions,
        startsAt: data.startsAt,
        expiresAt: data.expiresAt,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(['El código promocional ya existe']);
      }
      throw error;
    }
  }

  async update(id: number, data: PromotionCodeUpdateDto) {
    const current = await this.promotionCodeRepository.findOne(id);
    if (!current) {
      throw new NotFoundException(
        `Promotion code with ID ${id} not found`,
      );
    }

    if (
      data.maxRedemptions !== undefined &&
      data.maxRedemptions < current.redemptionCount
    ) {
      throw new BadRequestException([
        'El máximo de usos no puede ser menor a los usos ya realizados',
      ]);
    }

    const startsAt = data.startsAt ?? current.startsAt ?? undefined;
    const expiresAt = data.expiresAt ?? current.expiresAt ?? undefined;
    this.assertDateRange(startsAt, expiresAt);

    try {
      return await this.promotionCodeRepository.update(id, {
        ...data,
        code: data.code ? this.normalizeCode(data.code) : undefined,
        description:
          data.description === undefined
            ? undefined
            : data.description.trim() || null,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(['El código promocional ya existe']);
      }
      throw error;
    }
  }

  async redeem(currentUserId: number, data: PromotionCodeRedeemDto) {
    const checkout = await this.paymentRepository.findOne(data.checkoutId);
    if (!checkout) {
      throw new NotFoundException(
        `Mercado Pago checkout with ID ${data.checkoutId} not found`,
      );
    }
    if (checkout.pymeId !== currentUserId) {
      throw new UnauthorizedException('No tienes acceso a este checkout');
    }

    const previousRedemption =
      await this.promotionCodeRepository.findRedemptionByCheckout(checkout.id);
    if (previousRedemption?.meetingId) {
      return {
        meetingId: previousRedemption.meetingId,
        checkoutId: checkout.id,
        code: this.normalizeCode(data.code),
        message: 'Consultoría gratuita confirmada',
      };
    }

    if (checkout.meetingId || checkout.status === 'approved') {
      throw new BadRequestException(['Este checkout ya fue pagado']);
    }
    if (!checkout.meetingDetails) {
      throw new BadRequestException([
        'El checkout no contiene los datos de la reunión',
      ]);
    }

    const claim = await this.promotionCodeRepository.claim(
      this.normalizeCode(data.code),
      checkout.id,
      checkout.pymeId,
      checkout.consultantId,
    );
    if (!claim) {
      throw new BadRequestException([
        'El código no existe, venció o ya alcanzó su límite de usos',
      ]);
    }

    let meetingId: number | undefined;
    try {
      const meeting = await this.meetingService.create({
        pymeId: checkout.pymeId,
        consultantId: checkout.consultantId,
        startTime: new Date(checkout.meetingDetails.startTime),
        durationMinutes: checkout.meetingDetails.durationMinutes,
        title: checkout.meetingDetails.title,
        description: checkout.meetingDetails.description || undefined,
        requestedBy: 'pyme',
      });
      meetingId = meeting.id;

      await this.meetingService.confirm(meeting.id);
      await this.promotionCodeRepository.finalizeClaim(
        claim.redemption.id,
        checkout.id,
        meeting.id,
        {
          source: 'promotion_code',
          promotionCodeId: claim.promotion.id,
          promotionCode: claim.promotion.code,
          redemptionId: claim.redemption.id,
        },
      );

      return {
        meetingId: meeting.id,
        checkoutId: checkout.id,
        code: claim.promotion.code,
        message: 'Consultoría gratuita confirmada',
      };
    } catch (error) {
      if (meetingId) {
        await this.meetingService.delete(meetingId).catch(() => undefined);
      }
      await this.promotionCodeRepository.releaseClaim(claim.redemption.id);
      throw error;
    }
  }

  private normalizeCode(code: string) {
    const normalized = code
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!normalized) {
      throw new BadRequestException(['El código promocional no es válido']);
    }
    return normalized;
  }

  private generateCode() {
    return `HUBSME-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private assertDateRange(startsAt?: Date, expiresAt?: Date) {
    if (startsAt && expiresAt && startsAt >= expiresAt) {
      throw new BadRequestException([
        'La fecha de vencimiento debe ser posterior a la fecha de inicio',
      ]);
    }
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
}
