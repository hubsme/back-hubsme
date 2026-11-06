import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import {
  MeetingRescheduleStepDto,
  MeetingTraceabilityPayoutSummaryDto,
  MeetingTraceabilityMeetingSummaryDto,
} from '@modules/admin/modules/meeting/dto/calendar.dto';

@Trace({ type: 'validation' })
export class MeetingRescheduleTraceabilityDto {
  @ApiProperty({ type: () => MeetingTraceabilityPayoutSummaryDto })
  payout: MeetingTraceabilityPayoutSummaryDto;

  @ApiProperty({ type: () => MeetingTraceabilityMeetingSummaryDto })
  rootMeeting: MeetingTraceabilityMeetingSummaryDto;

  @ApiProperty({ type: () => MeetingTraceabilityMeetingSummaryDto })
  latestMeeting: MeetingTraceabilityMeetingSummaryDto;

  @ApiProperty({ description: 'Total de veces que la reunión fue cancelada y reagendada' })
  rescheduleCount: number;

  @ApiProperty({ type: () => [MeetingRescheduleStepDto] })
  history: MeetingRescheduleStepDto[];
}
