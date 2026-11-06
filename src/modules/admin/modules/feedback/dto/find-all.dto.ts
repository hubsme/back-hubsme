import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { feedbackStatusEnum } from '@db/tables/feedback.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';

@Trace({ type: 'validation' })
export class FeedbackListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ enum: feedbackStatusEnum.enumValues })
  @IsIn(feedbackStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof feedbackStatusEnum.enumValues)[number];
}

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class FeedbackListDto {
  @ApiProperty({ type: () => [FeedbackListItemDto] })
  data: FeedbackListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
