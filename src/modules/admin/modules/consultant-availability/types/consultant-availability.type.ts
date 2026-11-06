export type MeetingConflict = {
  id: number;
  startTime: Date;
  durationMinutes: number;
  status: string;
};

export type BusyConflict = {
  startTime: Date | string;
  endTime: Date | string;
};

export type AvailabilityValidationOptions = {
  enforceBookingNotice?: boolean;
};
