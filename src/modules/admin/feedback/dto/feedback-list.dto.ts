import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { feedbackStatusEnum } from '@db/tables/feedback.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { FeedbackListItemDto } from './feedback-result.dto';

export class FeedbackListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ enum: feedbackStatusEnum.enumValues })
  @IsIn(feedbackStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof feedbackStatusEnum.enumValues)[number];
}

export class FeedbackAdminListFiltersDto extends FeedbackListFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por título, descripción, usuario o correo' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['pyme', 'consultor'] })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  userRole?: 'pyme' | 'consultor';
}

export class FeedbackListDto {
  @ApiProperty({ type: [FeedbackListItemDto] })
  data: FeedbackListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
