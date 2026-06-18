import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  consultantMercadoPagoAccount,
  ConsultantMercadoPagoAccountDTO,
} from '@db/tables/consultant-mercado-pago-account.table';

@Injectable()
export class ConsultantMercadoPagoAccountRepository {
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

  async upsertByConsultantId(consultantId: number, data: ConsultantMercadoPagoAccountDTO) {
    const current = await this.findByConsultantId(consultantId);
    if (current) {
      return this.update(current.id, data);
    }

    const result = await database.insert(consultantMercadoPagoAccount).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<ConsultantMercadoPagoAccountDTO>) {
    const result = await database
      .update(consultantMercadoPagoAccount)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantMercadoPagoAccount.id, id), isNull(consultantMercadoPagoAccount.deletedAt)))
      .returning();
    return result[0];
  }

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
