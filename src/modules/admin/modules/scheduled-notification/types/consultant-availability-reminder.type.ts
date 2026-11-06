import type { ConsultantJoinQuery } from '@queries/consultant/consultant-join.query';

export type WeekDate = {
  date: Date;
  monthKey: string;
  dayKey: string;
};

export type ConsultantNotificationRecipient = Awaited<
  ReturnType<ConsultantJoinQuery['findActiveNotificationRecipients']>
>[number];
