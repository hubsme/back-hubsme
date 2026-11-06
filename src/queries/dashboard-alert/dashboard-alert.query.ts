import { database, transaction } from '@db/connection.db';
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { TraceNode } from '@erixcel/traceflow';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class DashboardAlertQuery {
  readonly transaction = transaction;

  @TraceNode({ name: 'dashboard-alert.findActiveForDashboard', type: 'method' })
  async findActiveForDashboard(scope: { userId?: number; role?: 'admin' | 'pyme' | 'consultor' }) {
    const conditions = [isNull(dashboardAlert.deletedAt), eq(dashboardAlert.status, 'active' as const)];
    if (scope.userId && scope.role === 'consultor') conditions.push(eq(dashboardAlert.consultantId, scope.userId));
    if (scope.userId && scope.role === 'pyme') conditions.push(eq(dashboardAlert.pymeId, scope.userId));
    return database
      .select({
        id: dashboardAlert.id,
        client: dashboardAlert.clientName,
        message: dashboardAlert.message,
        tone: dashboardAlert.tone,
      })
      .from(dashboardAlert)
      .where(and(...conditions))
      .orderBy(desc(dashboardAlert.createdAt))
      .limit(5);
  }
}
