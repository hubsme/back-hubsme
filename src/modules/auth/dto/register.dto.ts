import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength, ValidateNested } from 'class-validator';
import {
  ConsultantCaseStudyDto,
  ConsultantEducationDto,
} from '@modules/admin/consultant/dto/consultant-profile-fields.dto';

export class RegisterDto {
  @ApiProperty({ example: 'maria@empresa.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'User password, minimum 6 characters' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Textiles del Sur SAC', description: 'User or business display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Maria', description: 'Consultant first name or PYME owner first name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Torres', description: 'Consultant last name or PYME owner last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '20600000001', description: 'PYME RUC' })
  @IsString()
  @IsOptional()
  ruc?: string;

  @ApiPropertyOptional({ example: '+51999888777', description: 'PYME owner phone' })
  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @ApiPropertyOptional({ example: 'Gerente general', description: 'PYME owner position' })
  @IsString()
  @IsOptional()
  ownerPosition?: string;

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

  @ApiPropertyOptional({ example: 'Consultor en finanzas para PYMES.' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: ['Finanzas', 'Tributario'], type: [String] })
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

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme' })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  role?: 'pyme' | 'consultor' = 'pyme';
}
