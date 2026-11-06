import { database } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { checkout } from '@db/tables/checkout.table';
import { consultant } from '@db/tables/consultant.table';
import { promotionCodeRedemption } from '@db/tables/promotion-code-redemption.table';
import { pyme } from '@db/tables/pyme.table';
import { and, desc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class PromotionCodeRedemptionJoinQuery {
  @TraceNode({ name: 'promotion-code-redemption.findRedemptionsByPromotionCode', type: 'method' })
  async findRedemptionsByPromotionCode(id: number) {
    return await database
      .select({
        id: promotionCodeRedemption.id,
        checkoutId: promotionCodeRedemption.checkoutId,
        serviceRequestId: checkout.serviceRequestId,
        serviceInstallmentIndex: checkout.serviceInstallmentIndex,
        pymeId: promotionCodeRedemption.pymeId,
        pymeName: pyme.name,
        consultantId: promotionCodeRedemption.consultantId,
        consultantName: consultant.fullName,
        meetingId: promotionCodeRedemption.meetingId,
        redeemedAt: promotionCodeRedemption.redeemedAt,
      })
      .from(promotionCodeRedemption)
      .leftJoin(checkout, eq(promotionCodeRedemption.checkoutId, checkout.id))
      .leftJoin(pyme, eq(promotionCodeRedemption.pymeId, pyme.id))
      .leftJoin(consultant, eq(promotionCodeRedemption.consultantId, consultant.id))
      .where(and(eq(promotionCodeRedemption.promotionCodeId, id), isNull(promotionCodeRedemption.deletedAt)))
      .orderBy(desc(promotionCodeRedemption.redeemedAt));
  }
}
