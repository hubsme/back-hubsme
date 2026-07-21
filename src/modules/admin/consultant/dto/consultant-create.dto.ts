import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { ConsultantCaseStudyDto, ConsultantEducationDto } from './consultant-profile-fields.dto';
import {
  CONSULTANT_DIAGNOSTIC_AREAS,
  ConsultantDiagnosticArea,
} from '@core/consultant-diagnostic-area';

export class ConsultantCreateDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  userId: number;

  @ApiPropertyOptional({ example: 'Carlos' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mendoza' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Carlos Mendoza' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '51929073820' })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ example: 'Consultor financiero y tributario para PYMES' })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional({ example: 'Lima, Perú' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Presencial en Lima y remoto a nivel nacional' })
  @IsString()
  @IsOptional()
  workModality?: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/carlos-mendoza' })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'Consultor en transformacion digital para PYMES.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    enum: CONSULTANT_DIAGNOSTIC_AREAS,
    isArray: true,
    example: ['Estratégica', 'Operaciones'],
  })
  @IsArray()
  @IsIn(CONSULTANT_DIAGNOSTIC_AREAS, { each: true })
  @IsOptional()
  diagnosticAreas?: ConsultantDiagnosticArea[];

  @ApiPropertyOptional({ example: ['Tecnologia', 'Operaciones'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiPropertyOptional({ example: ['Retail', 'Manufactura'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sectors?: string[];

  @ApiPropertyOptional({ example: ['Comercio', 'Gastronomia'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  industries?: string[];

  @ApiPropertyOptional({ example: ['Microempresa', 'Pequeña empresa'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  companyTypes?: string[];

  @ApiPropertyOptional({ example: ['Diagnóstico', 'Implementación'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @ApiPropertyOptional({ type: [ConsultantEducationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultantEducationDto)
  @IsOptional()
  education?: ConsultantEducationDto[];

  @ApiPropertyOptional({ example: ['NIIF para PYMES'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ example: ['Retail', 'Logistica'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workedSectors?: string[];

  @ApiPropertyOptional({ type: [ConsultantCaseStudyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultantCaseStudyDto)
  @IsOptional()
  caseStudies?: ConsultantCaseStudyDto[];

  @ApiPropertyOptional({ example: 'Texto extraido del CV del consultor...' })
  @IsString()
  @IsOptional()
  cvText?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/consultants/cv.pdf' })
  @IsString()
  @IsOptional()
  cvUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/consultants/photo.jpg' })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/consultants/video.mp4' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 150 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerHour?: number;

  @ApiPropertyOptional({ enum: ['true', 'false'], default: 'true' })
  @IsIn(['true', 'false'])
  @IsOptional()
  active?: string;

}
