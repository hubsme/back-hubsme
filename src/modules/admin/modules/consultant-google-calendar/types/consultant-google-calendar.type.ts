export type GoogleCalendarState = {
  flow: 'consultant-calendar';
  consultantId: number;
};

export type GoogleCalendarTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

export type GoogleUserInfo = {
  email?: string;
  email_verified?: boolean;
};

export type GoogleCalendarEventDate = {
  date?: string;
  dateTime?: string;
};

export type GoogleCalendarEvent = {
  id?: string;
  summary?: string;
  status?: string;
  transparency?: string;
  start?: GoogleCalendarEventDate;
  end?: GoogleCalendarEventDate;
};

export type GoogleCalendarEventsResponse = {
  items?: GoogleCalendarEvent[];
  error?: {
    message?: string;
  };
};
