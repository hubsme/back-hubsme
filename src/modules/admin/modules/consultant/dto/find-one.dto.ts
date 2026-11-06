import { consultantDiagnosticAreaEnum, consultantWorkModalityEnum } from '@db/tables/consultant.table';
import { Trace } from '@erixcel/traceflow';
import { ConsultantCaseStudyDto, ConsultantEducationDto } from '@modules/admin/modules/consultant/dto/find-all.dto';
import { ApiProperty } from '@nestjs/swagger';

@Trace({ type: 'validation' })
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
  userEmail: string;

  @ApiProperty({ enum: ['local', 'google'] })
  authProvider: 'local' | 'google';

  @ApiProperty()
  fullName: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ nullable: true, example: '72750623' })
  dni: string | null;

  @ApiProperty({ nullable: true, example: '1990-05-21', format: 'date' })
  birthDate: string | null;

  @ApiProperty({ nullable: true })
  ownerPhone: string | null;

  @ApiProperty({ nullable: true })
  headline: string | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiProperty({ enum: consultantWorkModalityEnum.enumValues })
  workModality: (typeof consultantWorkModalityEnum.enumValues)[number];

  @ApiProperty({ nullable: true })
  linkedinUrl: string | null;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ enum: consultantDiagnosticAreaEnum.enumValues, isArray: true })
  diagnosticAreas: (typeof consultantDiagnosticAreaEnum.enumValues)[number][];

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

  @ApiProperty({ type: () => [ConsultantEducationDto] })
  education: ConsultantEducationDto[];

  @ApiProperty({ type: [String] })
  certifications: string[];

  @ApiProperty({ type: [String] })
  workedSectors: string[];

  @ApiProperty({ type: () => [ConsultantCaseStudyDto] })
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

  @ApiProperty({
    example: 48,
    default: 48,
    description: 'Horas mínimas de anticipación para reservar.',
  })
  minimumBookingNoticeHours: number;

  @ApiProperty()
  rating: string;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty({ enum: ['true', 'false'] })
  active: string;

  @ApiProperty({ enum: ['true', 'false'] })
  validated: string;
}
