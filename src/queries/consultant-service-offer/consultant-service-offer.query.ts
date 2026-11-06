import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultantServiceOffer } from '@db/tables/consultant-service-offer.table';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class ConsultantServiceOfferQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'consultant-service-offer.create', type: 'method' })
  async create(data: typeof consultantServiceOffer.$inferInsert) {
    const [created] = await database
      .insert(consultantServiceOffer)
      .values(data)
      .returning({ id: consultantServiceOffer.id });
    return created;
  }

  @TraceNode({ name: 'consultant-service-offer.update', type: 'method' })
  async update(id: number, data: Partial<typeof consultantServiceOffer.$inferInsert>) {
    const [updated] = await database
      .update(consultantServiceOffer)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantServiceOffer.id, id), isNull(consultantServiceOffer.deletedAt)))
      .returning({ id: consultantServiceOffer.id });
    return updated;
  }

  @TraceNode({ name: 'consultant-service-offer.delete', type: 'method' })
  async delete(id: number) {
    return this.update(id, { deletedAt: new Date(), isActive: false });
  }
}
