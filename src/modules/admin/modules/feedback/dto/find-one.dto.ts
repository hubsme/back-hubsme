import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { FeedbackReplyResultDto } from '@modules/admin/modules/feedback/dto/reply.dto';
import { FeedbackListItemDto } from '@modules/admin/modules/feedback/dto/find-all.dto';

@Trace({ type: 'validation' })
export class FeedbackAttachmentResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  storagePath: string;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  sizeBytes: number;
}

@Trace({ type: 'validation' })
export class FeedbackResultDto extends FeedbackListItemDto {
  @ApiProperty({ type: () => [FeedbackAttachmentResultDto] })
  attachments: FeedbackAttachmentResultDto[];

  @ApiProperty({ type: () => [FeedbackReplyResultDto] })
  replies: FeedbackReplyResultDto[];
}
