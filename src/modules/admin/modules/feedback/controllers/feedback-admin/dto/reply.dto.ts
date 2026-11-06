import { Trace } from '@erixcel/traceflow';
import { FeedbackResultDto } from '@modules/admin/modules/feedback/dto/find-one.dto';

@Trace({ type: 'validation' })
export class FeedbackAdminReplyResultDto extends FeedbackResultDto {}
