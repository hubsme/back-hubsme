import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class ConsultantMercadoPagoAccountQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'consultant-mercado-pago-account.findByConsultantId', type: 'method' })
  async findByConsultantId(consultantId: number) {
    const result = await database
      .select()
      .from(consultantMercadoPagoAccount)
      .where(
        and(
          eq(consultantMercadoPagoAccount.consultantId, consultantId),
          isNull(consultantMercadoPagoAccount.deletedAt),
        ),
      );
    return result[0];
  }

  @TraceNode({ name: 'consultant-mercado-pago-account.findConnectionDetailsByConsultantId', type: 'method' })
  async findConnectionDetailsByConsultantId(consultantId: number) {
    const result = await database
      .select({
        mercadoPagoUserId: consultantMercadoPagoAccount.mercadoPagoUserId,
        nickname: consultantMercadoPagoAccount.nickname,
        email: consultantMercadoPagoAccount.email,
        connectedAt: consultantMercadoPagoAccount.connectedAt,
        lastUpdatedAt: consultantMercadoPagoAccount.updatedAt,
      })
      .from(consultantMercadoPagoAccount)
      .where(
        and(
          eq(consultantMercadoPagoAccount.consultantId, consultantId),
          isNull(consultantMercadoPagoAccount.deletedAt),
        ),
      );
    return result[0];
  }

  @TraceNode({ name: 'consultant-mercado-pago-account.upsertByConsultantId', type: 'method' })
  async upsertByConsultantId(consultantId: number, data: typeof consultantMercadoPagoAccount.$inferInsert) {
    const current = await this.findByConsultantId(consultantId);
    if (current) {
      return this.update(current.id, data);
    }
    const result = await database.insert(consultantMercadoPagoAccount).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-mercado-pago-account.update', type: 'method' })
  async update(id: number, data: Partial<typeof consultantMercadoPagoAccount.$inferInsert>) {
    const result = await database
      .update(consultantMercadoPagoAccount)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantMercadoPagoAccount.id, id), isNull(consultantMercadoPagoAccount.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-mercado-pago-account.deleteByConsultantId', type: 'method' })
  async deleteByConsultantId(consultantId: number) {
    const result = await database
      .update(consultantMercadoPagoAccount)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(consultantMercadoPagoAccount.consultantId, consultantId),
          isNull(consultantMercadoPagoAccount.deletedAt),
        ),
      )
      .returning();
    return result[0];
  }
}
