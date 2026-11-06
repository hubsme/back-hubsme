import { consultantDiagnosticAreaEnum } from '@db/tables/consultant.table';
import {
  serviceRequestBudgetTypeEnum,
  serviceRequestCategoryEnum,
  serviceRequestWorkModalityEnum,
} from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

@Trace({ type: 'validation' })
export class TaskSuggestionDto {
  @ApiProperty({ description: 'Título accionable de la tarea sugerida' })
  title: string;

  @ApiProperty({ description: 'Descripción detallada de la tarea' })
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], description: 'Responsable asignado' })
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'], description: 'Prioridad de la tarea' })
  priority: 'alta' | 'media' | 'baja';

  @ApiPropertyOptional({ description: 'Fecha límite sugerida en formato YYYY-MM-DD', example: '2026-06-15' })
  dueDate?: string;
}

@Trace({ type: 'validation' })
export class HubsmeAiResultDto {
  @ApiProperty({ description: 'Acta de reunion estructurada en Markdown' })
  summary: string;

  @ApiProperty({
    type: () => [TaskSuggestionDto],
    description: 'Listado de compromisos sugeridos para la PYME y el consultor',
  })
  tasks: TaskSuggestionDto[];
}

@Trace({ type: 'validation' })
export class HubsmeAiRunDto {
  @ApiProperty({ description: 'Texto de la transcripción a procesar' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Instrucciones o prompt opcional para el modelo de IA',
  })
  @IsString()
  @IsOptional()
  prompt?: string;
}

@Trace({ type: 'validation' })
export class ServiceConsultantMatchDto {
  @ApiProperty()
  @IsInt()
  consultantId: number;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty({ nullable: true })
  headline: string | null;

  @ApiProperty({ nullable: true })
  photoUrl: string | null;

  @ApiProperty({ enum: consultantDiagnosticAreaEnum.enumValues, isArray: true })
  diagnosticAreas: (typeof consultantDiagnosticAreaEnum.enumValues)[number][];

  @ApiProperty({ type: [String] })
  specialties: string[];

  @ApiProperty({ type: [String] })
  services: string[];

  @ApiProperty()
  yearsExperience: number;

  @ApiProperty()
  rating: string;

  @ApiProperty({ maxLength: 400 })
  @IsString()
  @MaxLength(400)
  reason: string;
}

@Trace({ type: 'validation' })
export class ServiceRequestChatMessageDto {
  @ApiProperty({ enum: ['assistant', 'user'] })
  @IsIn(['assistant', 'user'])
  role: 'assistant' | 'user';

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

@Trace({ type: 'validation' })
export class ServiceRequestMilestoneDraftDto {
  @ApiProperty({ maxLength: 240 })
  @IsString()
  @MaxLength(240)
  title: string;

  @ApiProperty({ example: '2026-09-15', maxLength: 10 })
  @IsString()
  @MaxLength(10)
  dueDate: string;
}

@Trace({ type: 'validation' })
export class ServiceRequestDraftDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: ['', ...serviceRequestCategoryEnum.enumValues] })
  @IsIn(['', ...serviceRequestCategoryEnum.enumValues])
  category: (typeof serviceRequestCategoryEnum.enumValues)[number] | '';

  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  subcategory: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  expectedOutcome: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  requirements: string;

  @ApiProperty({ type: [String], maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  deliverables: string[];

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  exclusions: string;

  @ApiProperty({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ require_protocol: true }, { each: true })
  referenceUrls: string[];

  @ApiProperty({ enum: ['', ...serviceRequestBudgetTypeEnum.enumValues] })
  @IsIn(['', ...serviceRequestBudgetTypeEnum.enumValues])
  budgetType: (typeof serviceRequestBudgetTypeEnum.enumValues)[number] | '';

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  budgetMin: string;

  @ApiProperty({ maxLength: 20 })
  @IsString()
  @MaxLength(20)
  budgetMax: string;

  @ApiProperty({ example: '2026-09-30', maxLength: 10 })
  @IsString()
  @MaxLength(10)
  deadline: string;

  @ApiProperty({ example: '4 semanas', maxLength: 160 })
  @IsString()
  @MaxLength(160)
  estimatedDuration: string;

  @ApiProperty({ enum: serviceRequestWorkModalityEnum.enumValues })
  @IsIn(serviceRequestWorkModalityEnum.enumValues)
  workModality: (typeof serviceRequestWorkModalityEnum.enumValues)[number];

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  workMethod: string;

  @ApiProperty({ type: () => [ServiceRequestMilestoneDraftDto], maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestMilestoneDraftDto)
  milestones: ServiceRequestMilestoneDraftDto[];

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  details: string;
}
