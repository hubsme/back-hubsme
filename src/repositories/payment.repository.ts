import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { payment, PaymentDTO } from '@db/tables/payment.table';

@Injectable()
export class PaymentRepository {
  async create(data: PaymentDTO) {
    const result = await database.insert(payment).values(data).returning();
    return result[0];
  }

  async findOne(id: number) {
    const result = await database.select().from(payment).where(eq(payment.id, id));
    return result[0];
  }

  async findByExternalReference(ref: string) {
    const result = await database.select().from(payment).where(eq(payment.externalReference, ref));
    return result[0];
  }

  async update(id: number, data: Partial<PaymentDTO>) {
    const result = await database.update(payment).set(data).where(eq(payment.id, id)).returning();
    return result[0];
  }
}
