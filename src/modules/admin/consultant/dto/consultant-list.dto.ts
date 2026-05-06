import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class ConsultantListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by name, bio or specialty' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsIn(['true', 'false'])
  @IsOptional()
  active?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsIn(['true', 'false'])
  @IsOptional()
  validated?: string;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsString()
  @IsOptional()
  sector?: string;
}

export class ConsultantListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  sectors: string[];

  @ApiProperty()
  pricePerHour: string;

  @ApiProperty()
  rating: string;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ enum: ['true', 'false'] })
  active: string;

  @ApiProperty()
  createdAt: Date;
}

export class ConsultantListDto {
  @ApiProperty({ type: [ConsultantListItemDto] })
  data: ConsultantListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
