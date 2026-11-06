import { consultantDiagnosticAreaEnum } from '@db/tables/consultant.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

@Trace({ type: 'validation' })
export class PublicConsultantListFiltersDto extends PaginationFiltersDto {
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

@Trace({ type: 'validation' })
export class PublicConsultantListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ enum: consultantDiagnosticAreaEnum.enumValues, isArray: true })
  diagnosticAreas: (typeof consultantDiagnosticAreaEnum.enumValues)[number][];

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  sectors: string[];

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ nullable: true })
  videoUrl: string | null;

  @ApiProperty()
  pricePerHour: string;

  @ApiProperty()
  rating: string;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ enum: ['true', 'false'] })
  active: string;

  @ApiProperty({ enum: ['true', 'false'] })
  validated: string;

  @ApiProperty()
  createdAt: Date;
}

@Trace({ type: 'validation' })
export class PublicConsultantListDto {
  @ApiProperty({ type: () => [PublicConsultantListItemDto] })
  data: PublicConsultantListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
