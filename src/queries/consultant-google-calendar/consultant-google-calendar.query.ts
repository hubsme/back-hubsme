import { database, transaction } from '@db/connection.db';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';

import { consultantGoogleCalendar } from '@db/tables/consultant-google-calendar.table';
import { and, eq, isNull } from 'drizzle-orm';

@Injectable()
export class ConsultantGoogleCalendarQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'consultant-google-calendar.findByConsultantId', type: 'method' })
  async findByConsultantId(consultantId: number) {
    const result = await database
      .select()
      .from(consultantGoogleCalendar)
      .where(and(eq(consultantGoogleCalendar.consultantId, consultantId), isNull(consultantGoogleCalendar.deletedAt)));
    return result[0];
  }

  @TraceNode({ name: 'consultant-google-calendar.upsertByConsultantId', type: 'method' })
  async upsertByConsultantId(consultantId: number, data: typeof consultantGoogleCalendar.$inferInsert) {
    const current = await this.findByConsultantId(consultantId);
    if (current) {
      return this.update(current.id, data);
    }
    const result = await database.insert(consultantGoogleCalendar).values(data).returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-google-calendar.update', type: 'method' })
  async update(id: number, data: Partial<typeof consultantGoogleCalendar.$inferInsert>) {
    const result = await database
      .update(consultantGoogleCalendar)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(consultantGoogleCalendar.id, id), isNull(consultantGoogleCalendar.deletedAt)))
      .returning();
    return result[0];
  }

  @TraceNode({ name: 'consultant-google-calendar.deleteByConsultantId', type: 'method' })
  async deleteByConsultantId(consultantId: number) {
    const result = await database
      .update(consultantGoogleCalendar)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(consultantGoogleCalendar.consultantId, consultantId), isNull(consultantGoogleCalendar.deletedAt)))
      .returning();
    return result[0];
  }
}
