import { ApiProperty } from '@nestjs/swagger';
import { ConsultantCaseStudyDto, ConsultantEducationDto } from './consultant-profile-fields.dto';
import {
  CONSULTANT_DIAGNOSTIC_AREAS,
  ConsultantDiagnosticArea,
} from '@core/consultant-diagnostic-area';

export class ConsultantResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

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
  cvUrl: string | null;

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
}
