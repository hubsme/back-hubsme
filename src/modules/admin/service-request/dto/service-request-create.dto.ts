import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsDateString,
  IsArray,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  SERVICE_REQUEST_BUDGET_TYPES,
  SERVICE_REQUEST_CATEGORIES,
  SERVICE_REQUEST_WORK_MODALITIES,
} from '@db/tables/service-request.table';
import type {
  ServiceRequestBudgetType,
  ServiceRequestCategory,
  ServiceRequestWorkModality,
} from '@db/tables/service-request.table';

function parseJsonArrayValue(value: unknown): unknown {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
}

function parseJsonArray({ value }: TransformFnParams): unknown {
  return parseJsonArrayValue(value);
}

function parseNumberArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? parsed.map((item) => Number(item)) : parsed;
}

function parseMilestoneArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? plainToInstance(ServiceRequestMilestoneCreateDto, parsed) : parsed;
}

function parseInitialMeetingOptionArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? plainToInstance(ServiceRequestInitialMeetingOptionDto, parsed) : parsed;
}

export class ServiceRequestMilestoneCreateDto {
  @ApiProperty({ maxLength: 240 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  title: string;

  @ApiProperty({ example: '2026-09-15' })
  @IsDateString({ strict: true })
  dueDate: string;
}

export class ServiceRequestInitialMeetingOptionDto {
  @ApiProperty({ example: 12 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({
    type: [String],
    example: ['2026-08-12T15:00:00.000Z', '2026-08-13T15:00:00.000Z', '2026-08-14T15:00:00.000Z'],
    minItems: 3,
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  proposedStartTimes: string[];
}

export class ServiceRequestCreateDto {
  @ApiProperty({ type: [Number], example: [8, 12, 19], minItems: 1, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @Transform(parseNumberArray)
  @IsInt({ each: true })
  consultantIds: number[];

  @ApiProperty({ type: [ServiceRequestInitialMeetingOptionDto], minItems: 1, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestInitialMeetingOptionDto)
  @Transform(parseInitialMeetingOptionArray)
  initialMeetingOptions: ServiceRequestInitialMeetingOptionDto[];

  @ApiProperty({ example: 'Capacitación de seguridad para el personal', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: SERVICE_REQUEST_CATEGORIES, example: 'Marketing' })
  @IsIn(SERVICE_REQUEST_CATEGORIES)
  category: ServiceRequestCategory;

  @ApiProperty({ example: 'Redes sociales', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  subcategory: string;

  @ApiProperty({ example: 'La marca publica sin una estrategia ni calendario definido.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 'Contar con una estrategia y un calendario aplicable durante tres meses.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  expectedOutcome: string;

  @ApiProperty({ example: 'Diagnóstico, propuesta y acompañamiento durante la implementación.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  requirements: string;

  @ApiProperty({ type: [String], example: ['Estrategia documentada en PDF', 'Calendario editable de 3 meses'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @Transform(parseJsonArray)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(500, { each: true })
  deliverables: string[];

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  exclusions?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @Transform(parseJsonArray)
  @IsUrl({ require_protocol: true }, { each: true })
  @IsOptional()
  referenceUrls?: string[];

  @ApiProperty({ enum: SERVICE_REQUEST_BUDGET_TYPES })
  @IsIn(SERVICE_REQUEST_BUDGET_TYPES)
  budgetType: ServiceRequestBudgetType;

  @ApiProperty({ example: 1500, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  budgetMin: number;

  @ApiPropertyOptional({ example: 2500, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  budgetMax?: number;

  @ApiProperty({ example: '2026-09-30' })
  @IsDateString({ strict: true })
  deadline: string;

  @ApiProperty({ example: '4 semanas', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  estimatedDuration: string;

  @ApiProperty({ enum: SERVICE_REQUEST_WORK_MODALITIES, example: 'remote' })
  @IsIn(SERVICE_REQUEST_WORK_MODALITIES)
  workModality: ServiceRequestWorkModality;

  @ApiProperty({ example: 'Una reunión semanal y coordinación asíncrona por correo.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  workMethod: string;

  @ApiPropertyOptional({ type: [ServiceRequestMilestoneCreateDto], maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @Transform(parseMilestoneArray)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestMilestoneCreateDto)
  @IsOptional()
  milestones?: ServiceRequestMilestoneCreateDto[];

  @ApiPropertyOptional({ example: 'Disponibilidad durante la segunda semana del mes.', maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  details?: string;
}

export class ServiceRequestCreateMultipartDto extends ServiceRequestCreateDto {
  @ApiPropertyOptional({
    description: 'Hasta 5 archivos de referencia de máximo 10 MB cada uno',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: string[];
}
