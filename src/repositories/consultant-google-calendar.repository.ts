import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import {
  consultantGoogleCalendar,
  ConsultantGoogleCalendarDTO,
} from '@db/tables/consultant-google-calendar.table';

@Injectable()
export class ConsultantGoogleCalendarRepository {
  async findByConsultantId(consultantId: number) {
    const result = await database
      .select()
      .from(consultantGoogleCalendar)
      .where(and(eq(consultantGoogleCalendar.consultantId, consultantId), isNull(consultantGoogleCalendar.deletedAt)));
    return result[0];
  }

  async upsertByConsultantId(consultantId: number, data: ConsultantGoogleCalendarDTO) {
    const current = await this.findByConsultantId(consultantId);
    if (current) {
      return this.update(current.id, data);
    }

    const result = await database.insert(consultantGoogleCalendar).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<ConsultantGoogleCalendarDTO>) {
    const result = await database
      .update(consultantGoogleCalendar)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantGoogleCalendar.id, id), isNull(consultantGoogleCalendar.deletedAt)))
      .returning();
    return result[0];
  }

  async deleteByConsultantId(consultantId: number) {
    const result = await database
      .update(consultantGoogleCalendar)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(consultantGoogleCalendar.consultantId, consultantId), isNull(consultantGoogleCalendar.deletedAt)))
      .returning();
    return result[0];
  }
}
