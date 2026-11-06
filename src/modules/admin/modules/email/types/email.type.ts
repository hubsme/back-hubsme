export type MeetingConfirmedEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  dateTime: string;
  duration: string;
  meetingUrl?: string | null;
  reminderTime?: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
};

export type MeetingReminderEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  dateTime: string;
  duration: string;
  meetingUrl?: string | null;
  reminderTime: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
};

export type MeetingPendingEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  proposedStartTimes: string[];
  duration: string;
  sessionNotes?: string | null;
  recipientType: 'pyme' | 'consultor';
  meetingDetailsUrl?: string;
};

export type MeetingCancellationEmail = {
  to: string;
  recipientName: string;
  counterpartName: string;
  meetingTitle: string;
  dateTime: string;
  duration: string;
  cancellationReason: string;
  couponCode?: string;
  recipientType: 'pyme' | 'consultor';
};

export type SupportFeedbackNotificationEmail = {
  to: string;
  feedbackId: number;
  title: string;
  description: string;
  userName: string;
  userEmail: string;
  userRole: 'pyme' | 'consultor';
  attachmentCount: number;
  adminUrl: string;
};

export type AvailabilityPendingReminderEmail = {
  to: string;
  consultantName: string;
  period: string;
  calendarUrl: string;
};
