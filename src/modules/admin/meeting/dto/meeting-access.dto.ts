import { ApiProperty } from '@nestjs/swagger';

export const meetingAccessStatusValues = ['available', 'upcoming', 'expired', 'unavailable'] as const;
export type MeetingAccessStatus = (typeof meetingAccessStatusValues)[number];

export class MeetingAccessResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: meetingAccessStatusValues })
  status: MeetingAccessStatus;

  @ApiProperty({ nullable: true, type: Date })
  startTime: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  endTime: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  accessStartsAt: Date | null;

  @ApiProperty({ nullable: true, type: Date })
  accessEndsAt: Date | null;

  @ApiProperty({ nullable: true, type: String })
  redirectUrl: string | null;

  @ApiProperty()
  hasMinutes: boolean;
}
