import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { feedbackReplyAuthorTypeEnum } from '@db/tables/feedback-reply.table';

@Trace({ type: 'validation' })
export class FeedbackReplyCreateDto {
  @ApiProperty({ example: 'Gracias por el reporte. Ya estamos revisándolo.', maxLength: 3000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(3000)
  message: string;
}

@Trace({ type: 'validation' })
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
