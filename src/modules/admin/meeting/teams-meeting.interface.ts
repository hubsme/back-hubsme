export interface GraphListResponse<T> {
  value?: T[];
}

export interface GraphCalendarEvent {
  id?: string;
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
