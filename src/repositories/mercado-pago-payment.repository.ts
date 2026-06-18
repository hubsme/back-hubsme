import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { mercadoPagoPayment, MercadoPagoPaymentDTO } from '@db/tables/mercado-pago-payment.table';

@Injectable()
export class MercadoPagoPaymentRepository {
  async findOne(id: number) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.id, id), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByMeetingId(meetingId: number) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.meetingId, meetingId), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByExternalReference(externalReference: string) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.externalReference, externalReference), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async findByPreferenceId(preferenceId: string) {
    const result = await database
      .select()
      .from(mercadoPagoPayment)
      .where(and(eq(mercadoPagoPayment.preferenceId, preferenceId), isNull(mercadoPagoPayment.deletedAt)));
    return result[0];
  }

  async create(data: MercadoPagoPaymentDTO) {
    const result = await database.insert(mercadoPagoPayment).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<MercadoPagoPaymentDTO>) {
    const result = await database
      .update(mercadoPagoPayment)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(mercadoPagoPayment.id, id), isNull(mercadoPagoPayment.deletedAt)))
      .returning();
    return result[0];
  }
}
