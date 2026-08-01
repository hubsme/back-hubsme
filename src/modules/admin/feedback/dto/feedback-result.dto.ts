import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { feedbackReplyAuthorTypeEnum } from '@db/tables/feedback-reply.table';
import { feedbackStatusEnum } from '@db/tables/feedback.table';

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

export class FeedbackReplyResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: feedbackReplyAuthorTypeEnum.enumValues })
  authorType: (typeof feedbackReplyAuthorTypeEnum.enumValues)[number];

  @ApiPropertyOptional({ nullable: true })
  authorUserId: number | null;

  @ApiProperty()
  authorName: string;

  @ApiProperty()
  message: string;
}

export class FeedbackListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  userRole: 'pyme' | 'consultor';

  @ApiProperty()
  userName: string;

  @ApiProperty()
  userEmail: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: feedbackStatusEnum.enumValues })
  status: (typeof feedbackStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ nullable: true })
  statusUpdatedAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  statusUpdatedBy: string | null;

  @ApiProperty()
  attachmentCount: number;

  @ApiProperty()
  replyCount: number;
}

export class FeedbackResultDto extends FeedbackListItemDto {
  @ApiProperty({ type: [FeedbackAttachmentResultDto] })
  attachments: FeedbackAttachmentResultDto[];

  @ApiProperty({ type: [FeedbackReplyResultDto] })
  replies: FeedbackReplyResultDto[];
}
