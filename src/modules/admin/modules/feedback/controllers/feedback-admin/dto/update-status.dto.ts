import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { feedbackStatusEnum } from '@db/tables/feedback.table';

@Trace({ type: 'validation' })
export class FeedbackStatusUpdateDto {
  @ApiProperty({ enum: feedbackStatusEnum.enumValues })
  @IsIn(feedbackStatusEnum.enumValues)
  status: (typeof feedbackStatusEnum.enumValues)[number];
}
