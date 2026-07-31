const DEFAULT_FRONTEND_URL = 'http://localhost:6200';

export function buildMeetingAccessUrl(meetingId: number): string {
  const frontendUrl = process.env.FRONTEND_URL?.trim() || DEFAULT_FRONTEND_URL;
  return `${frontendUrl.replace(/\/+$/, '')}/reuniones/${meetingId}`;
}
