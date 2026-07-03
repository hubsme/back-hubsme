import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
} from '@modules/admin/consultant/dto/consultant-profile-fields.dto';

export class ConsultantCvProfileResultDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mendoza Rivas' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Carlos Mendoza Rivas' })
  @IsString()
  @IsOptional()
  fullName?: string;

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

  @ApiPropertyOptional({ example: 'Consultor financiero con foco en orden tributario.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: '51929073820' })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/carlos-mendoza' })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiProperty({ example: ['Finanzas', 'Tributario'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @ApiProperty({ example: ['Retail', 'Manufactura'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  sectors: string[];

  @ApiProperty({ example: ['Comercio', 'Gastronomia'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  industries: string[];

  @ApiProperty({ example: ['Microempresa', 'Pequeña empresa'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  companyTypes: string[];

  @ApiProperty({ example: ['Diagnóstico', 'Implementación'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  services: string[];

  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsExperience: number;

  @ApiProperty({ type: [ConsultantEducationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultantEducationDto)
  education: ConsultantEducationDto[];

  @ApiProperty({ example: ['NIIF para PYMES'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  certifications: string[];

  @ApiProperty({ example: ['Retail', 'Logistica'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  workedSectors: string[];

  @ApiProperty({ type: [ConsultantCaseStudyDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultantCaseStudyDto)
  caseStudies: ConsultantCaseStudyDto[];
}
