export interface GraphListResponse<T> {
  value?: T[];
  '@odata.nextLink'?: string;
}

export interface GraphCalendar {
  id?: string;
  allowedOnlineMeetingProviders?: string[];
  defaultOnlineMeetingProvider?: string;
}

export interface GraphCalendarEvent {
  id?: string;
  isOnlineMeeting?: boolean;
  onlineMeetingProvider?: string;
  onlineMeeting?: {
    joinUrl?: string;
  };
}

export interface GraphOnlineMeeting {
  id?: string;
  joinWebUrl?: string;
  recordAutomatically?: boolean;
  lobbyBypassSettings?: {
    scope?: string;
  };
}

export interface GraphCallRecording {
  id?: string;
  meetingId?: string;
  callId?: string;
  contentCorrelationId?: string;
  createdDateTime?: string;
  endDateTime?: string;
  recordingContentUrl?: string;
  meetingOrganizer?: unknown;
}

export interface GraphCallTranscript {
  id?: string;
  meetingId?: string;
  contentCorrelationId?: string;
  createdDateTime?: string;
}

export interface GraphDriveItem {
  id?: string;
  name?: string;
  webUrl?: string;
  '@microsoft.graph.downloadUrl'?: string;
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  parentReference?: {
    driveId?: string;
  };
}

export interface GraphSharingPermission {
  link?: {
    webUrl?: string;
  };
}

export interface MeetingRecording extends GraphCallRecording {
  driveId?: string | null;
  driveItemId?: string | null;
  fileName?: string | null;
  webUrl?: string | null;
  publicUrl?: string | null;
  downloadUrl?: string | null;
}
