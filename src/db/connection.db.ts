import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@db/config.db';

import { meeting } from '@db/tables/meeting.table';
import { user } from '@db/tables/user.table';
import { pyme } from '@db/tables/pyme.table';
import { subscription } from '@db/tables/subscription.table';
import { diagnostic } from '@db/tables/diagnostic.table';
import { diagnosticDocument } from '@db/tables/diagnostic-document.table';
import { consultant } from '@db/tables/consultant.table';
import { task } from '@db/tables/task.table';
import { pymeConsultantMatch } from '@db/tables/pyme-consultant-match.table';
import { pymeConsultantMessage } from '@db/tables/pyme-consultant-message.table';
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { consultantAvailability } from '@db/tables/consultant-availability.table';
import { consultantGoogleCalendar } from '@db/tables/consultant-google-calendar.table';
import { consultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { mercadoPagoPayment } from '@db/tables/mercado-pago-payment.table';

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
  pymeConsultantMatch,
  pymeConsultantMessage,
  dashboardAlert,
  consultantAvailability,
  consultantGoogleCalendar,
  consultantMercadoPagoAccount,
  mercadoPagoPayment,
};

export const database = drizzle(pool, { schema: schema });
