import { TraceNode } from '@erixcel/traceflow';

export class MeetingAccessUrlFunction {
  static readonly DEFAULT_FRONTEND_URL = 'http://localhost:6200';

  @TraceNode({ name: 'meeting-access-url.frontendBaseUrl', type: 'method' })
  static frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL?.trim() || MeetingAccessUrlFunction.DEFAULT_FRONTEND_URL).replace(/\/+$/, '');
  }

  @TraceNode({ name: 'meeting-access-url.buildMeetingAccessUrl', type: 'method' })
  static buildMeetingAccessUrl(meetingId: number): string {
    return `${MeetingAccessUrlFunction.frontendBaseUrl()}/reuniones/${meetingId}`;
  }

  @TraceNode({ name: 'meeting-access-url.buildMeetingDetailUrl', type: 'method' })
  static buildMeetingDetailUrl(meetingId: number, role: 'pyme' | 'consultor'): string {
    return `${MeetingAccessUrlFunction.frontendBaseUrl()}/admin/${role}/meetings/${meetingId}`;
  }
}
