import { consultantDiagnosticAreaEnum, consultantWorkModalityEnum } from '@db/tables/consultant.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { Trace } from '@erixcel/traceflow';
import { DiagnosticPayloadDto } from '@modules/admin/modules/diagnostic/dto/find-one.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { Type } from 'class-transformer';

@Trace({ type: 'validation' })
export class ConsultantMeetingDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  status: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;
}

@Trace({ type: 'validation' })
export class ConsultantDiagnosticDocumentDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  pymeName: string;

  @ApiProperty({ nullable: true })
  pymeLogoUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: () => DiagnosticPayloadDto })
  result: DiagnosticPayloadDto;

  @ApiProperty()
  score: number;
}

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class ConsultantEducationDto {
  @ApiProperty({ example: 'Contabilidad y Finanzas' })
  @IsString()
  degree: string;

  @ApiPropertyOptional({ example: 'Universidad de Lima' })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiPropertyOptional({ example: '2014' })
  @IsString()
  @IsOptional()
  year?: string;
}

@Trace({ type: 'validation' })
export class ConsultantCaseStudyDto {
  @ApiProperty({ example: 'Orden financiero para cadena gastronómica' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'No contaban con flujo de caja proyectado.' })
  @IsString()
  @IsOptional()
  problem?: string;

  @ApiPropertyOptional({ example: 'Implementó tablero financiero y control semanal.' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({ example: 'Reducción de quiebres de caja en 35%.' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({ example: 'Gastronomía' })
  @IsString()
  @IsOptional()
  sector?: string;
}

@Trace({ type: 'validation' })
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
export class ConsultantListDto {
  @ApiProperty({ type: () => [ConsultantListItemDto] })
  data: ConsultantListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

@Trace({ type: 'validation' })
export class ConsultantPymeActionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiPropertyOptional({ example: 'Puedo ayudarte con este diagnostico.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

@Trace({ type: 'validation' })
export class ConsultantPymeMessageActionDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiProperty({ example: 'Hola, te propongo revisar los avances en una llamada.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Trace({ type: 'validation' })
export class ConsultantPymeListFiltersDto extends PaginationFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiPropertyOptional({ description: 'Search by PYME name or sector' })
  @IsString()
  @IsOptional()
  search?: string;
}

@Trace({ type: 'validation' })
export class ConsultantPymeMessageListFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;
}
