export type WhatsappProviderResponse = Record<string, unknown> | string | null;

export type ProposedOption = {
  meetingId: number;
  optionIndex: number;
};

export type AvailabilityPendingReminder = {
  consultantName: string;
  period: string;
  calendarPath: string;
};
