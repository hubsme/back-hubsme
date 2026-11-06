import { dbConfig } from '@db/config.db';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgTable } from 'drizzle-orm/pg-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool } from 'pg';

import { checkout } from '@db/tables/checkout.table';
import { consultantAvailability } from '@db/tables/consultant-availability.table';
import { consultantGoogleCalendar } from '@db/tables/consultant-google-calendar.table';
import { consultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { consultantServiceOffer } from '@db/tables/consultant-service-offer.table';
import { consultant } from '@db/tables/consultant.table';
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { diagnosticDocument } from '@db/tables/diagnostic-document.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { feedbackAttachment } from '@db/tables/feedback-attachment.table';
import { feedbackReply } from '@db/tables/feedback-reply.table';
import { feedback } from '@db/tables/feedback.table';
import { meetingConsultantPayout } from '@db/tables/meeting-consultant-payout.table';
import { meetingRescheduleHistory } from '@db/tables/meeting-reschedule-history.table';
import { meeting } from '@db/tables/meeting.table';
import { promotionCodeRedemption } from '@db/tables/promotion-code-redemption.table';
import { promotionCode } from '@db/tables/promotion-code.table';
import { pymeInvitation } from '@db/tables/pyme-invitation.table';
import { pymeMember } from '@db/tables/pyme-member.table';
import { pyme } from '@db/tables/pyme.table';
import { scheduledNotification } from '@db/tables/scheduled-notification.table';
import { serviceRequest } from '@db/tables/service-request.table';
import { subscription } from '@db/tables/subscription.table';
import { task } from '@db/tables/task.table';
import { user } from '@db/tables/user.table';

const pool = new Pool(dbConfig);

const schema = {
  meeting,
  user,
  pyme,
  subscription,
  diagnostic,
  diagnosticDocument,
  consultant,
  task,
  dashboardAlert,
  consultantAvailability,
  consultantGoogleCalendar,
  consultantMercadoPagoAccount,
  checkout,
  serviceRequest,
  promotionCode,
  promotionCodeRedemption,
  scheduledNotification,
  feedback,
  feedbackAttachment,
  feedbackReply,
  consultantServiceOffer,
  meetingConsultantPayout,
  meetingRescheduleHistory,
  pymeMember,
  pymeInvitation,
} satisfies Record<string, PgTable>;

const connection = drizzle(pool, { schema });
const transactions = new AsyncLocalStorage<Parameters<Parameters<typeof connection.transaction>[0]>[0]>();

// Todas las queries de una operación usan la misma transacción, sin pasarla como argumento.
export const database = new Proxy(connection, {
  get(target, property) {
    const current = transactions.getStore() ?? target;
    const value = Reflect.get(current, property, current);
    return typeof value === 'function' ? value.bind(current) : value;
  },
});

export function transaction<T>(work: () => Promise<T>): Promise<T> {
  const current = transactions.getStore() ?? connection;
  return current.transaction((tx) => transactions.run(tx, work));
}
