const DEFAULT_FRONTEND_URL = 'http://localhost:6200';

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL?.trim() || DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
}

export function buildMeetingAccessUrl(meetingId: number): string {
  return `${frontendBaseUrl()}/reuniones/${meetingId}`;
}

export function buildMeetingDetailUrl(meetingId: number, role: 'pyme' | 'consultor'): string {
  return `${frontendBaseUrl()}/admin/${role}/meetings/${meetingId}`;
}
