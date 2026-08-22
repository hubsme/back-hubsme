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
import { dashboardAlert } from '@db/tables/dashboard-alert.table';
import { consultantAvailability } from '@db/tables/consultant-availability.table';
import { consultantGoogleCalendar } from '@db/tables/consultant-google-calendar.table';
import { consultantMercadoPagoAccount } from '@db/tables/consultant-mercado-pago-account.table';
import { checkout } from '@db/tables/checkout.table';
import { serviceRequest } from '@db/tables/service-request.table';
import { promotionCode, promotionCodeRedemption } from '@db/tables/promotion-code.table';
import { scheduledNotification } from '@db/tables/scheduled-notification.table';
import { feedback } from '@db/tables/feedback.table';
import { feedbackAttachment } from '@db/tables/feedback-attachment.table';
import { feedbackReply } from '@db/tables/feedback-reply.table';
import { consultantServiceOffer } from '@db/tables/consultant-service-offer.table';
import { meetingConsultantPayout } from '@db/tables/meeting-consultant-payout.table';
import { meetingRescheduleHistory } from '@db/tables/meeting-reschedule-history.table';
import { pymeMember } from '@db/tables/pyme-member.table';
import { pymeInvitation } from '@db/tables/pyme-invitation.table';

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
};

export const database = drizzle(pool, { schema: schema });
