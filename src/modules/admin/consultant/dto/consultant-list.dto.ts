import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { ConsultantCaseStudyDto, ConsultantEducationDto } from './consultant-profile-fields.dto';
import {
  CONSULTANT_DIAGNOSTIC_AREAS,
  ConsultantDiagnosticArea,
} from '@core/consultant-diagnostic-area';

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
  fullName: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true })
  ownerPhone: string | null;

  @ApiProperty({ nullable: true })
  headline: string | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ nullable: true })
  workModality: string | null;

  @ApiProperty({ nullable: true })
  linkedinUrl: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ enum: CONSULTANT_DIAGNOSTIC_AREAS, isArray: true })
  diagnosticAreas: ConsultantDiagnosticArea[];

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  sectors: string[];

  @ApiProperty({ type: [String] })
  industries: string[];

  @ApiProperty({ type: [String] })
  companyTypes: string[];

  @ApiProperty({ type: [String] })
  services: string[];

  @ApiProperty()
  yearsExperience: number;

  @ApiProperty({ type: [ConsultantEducationDto] })
  education: ConsultantEducationDto[];

  @ApiProperty({ type: [String] })
  certifications: string[];

  @ApiProperty({ type: [String] })
  workedSectors: string[];

  @ApiProperty({ type: [ConsultantCaseStudyDto] })
  caseStudies: ConsultantCaseStudyDto[];

  @ApiProperty({ nullable: true })
  cvText: string | null;

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

export class ConsultantListDto {
  @ApiProperty({ type: [ConsultantListItemDto] })
  data: ConsultantListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
