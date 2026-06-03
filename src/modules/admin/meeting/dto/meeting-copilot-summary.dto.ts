import { ApiProperty } from '@nestjs/swagger';

class CopilotActionItemDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ nullable: true })
  ownerDisplayName: string | null;
}

class CopilotMeetingNoteDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  text: string;
}

export class MeetingCopilotSummaryDto {
  @ApiProperty({ type: [CopilotMeetingNoteDto] })
  meetingNotes: CopilotMeetingNoteDto[];

  @ApiProperty({ type: [CopilotActionItemDto] })
  actionItems: CopilotActionItemDto[];
}
