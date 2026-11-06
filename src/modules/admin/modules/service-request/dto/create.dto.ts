import {
  serviceRequestBudgetTypeEnum,
  serviceRequestCategoryEnum,
  serviceRequestWorkModalityEnum,
} from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const SERVICE_REQUEST_CATEGORY_OPTIONS = [
  {
    category: 'Estratégica',
    subcategories: ['Planificación estratégica', 'Modelo de negocio', 'Transformación empresarial'],
  },
  {
    category: 'Financiera',
    subcategories: ['Planeamiento financiero', 'Costos y presupuestos', 'Financiamiento'],
  },
  {
    category: 'Comercial / Ventas',
    subcategories: ['Estrategia comercial', 'Proceso de ventas', 'CRM'],
  },
  {
    category: 'Marketing',
    subcategories: ['Redes sociales', 'Branding / Diseño', 'Marketing digital', 'Investigación de mercado'],
  },
  {
    category: 'Servicio al cliente',
    subcategories: ['Experiencia del cliente', 'Atención y soporte', 'Fidelización'],
  },
  {
    category: 'Operaciones',
    subcategories: ['Mejora de procesos', 'Logística', 'Calidad'],
  },
  {
    category: 'Organizacional / RRHH',
    subcategories: ['Selección', 'Capacitación', 'Cultura y clima'],
  },
  {
    category: 'Tecnología',
    subcategories: ['Desarrollo web', 'Software / Automatización', 'Datos / Analítica', 'Ciberseguridad'],
  },
  {
    category: 'Legal',
    subcategories: ['Contratos', 'Corporativo', 'Propiedad intelectual'],
  },
  {
    category: 'Laboral',
    subcategories: ['Cumplimiento laboral', 'Gestión de planillas', 'Seguridad y salud en el trabajo'],
  },
  {
    category: 'Tributario / Contable',
    subcategories: ['Contabilidad', 'Declaraciones tributarias', 'Facturación / SUNAT', 'Auditoría'],
  },
] as const;

export const SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES = ['single', 'initial_final', 'milestone_installments'] as const;

export const SERVICE_REQUEST_PAYMENT_TRIGGERS = [
  'service_approval',
  'milestone_completion',
  'service_completion',
] as const;

export const SERVICE_REQUEST_CATEGORIES = serviceRequestCategoryEnum.enumValues;

export const SERVICE_REQUEST_BUDGET_TYPES = serviceRequestBudgetTypeEnum.enumValues;

export const SERVICE_REQUEST_WORK_MODALITIES = serviceRequestWorkModalityEnum.enumValues;

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

export function parseJsonArray({ value }: TransformFnParams): unknown {
  return parseJsonArrayValue(value);
}

export function parseNumberArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? parsed.map((item) => Number(item)) : parsed;
}

@Trace({ type: 'validation' })
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

export function parseInitialMeetingOptionArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? plainToInstance(ServiceRequestInitialMeetingOptionDto, parsed) : parsed;
}

@Trace({ type: 'validation' })
export class ServiceRequestPaymentInstallmentDto {
  @ApiProperty({ example: 'Pago inicial para iniciar el servicio', maxLength: 180 })
  @IsString()
  @MaxLength(180)
  label: string;

  @ApiProperty({ example: 30, minimum: 10, maximum: 100 })
  @IsInt()
  @Min(10)
  @Max(100)
  percentage: number;

  @ApiProperty({ enum: SERVICE_REQUEST_PAYMENT_TRIGGERS })
  @IsIn(SERVICE_REQUEST_PAYMENT_TRIGGERS)
  trigger: 'service_approval' | 'milestone_completion' | 'service_completion';

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  milestoneIndex: number;
}

@Trace({ type: 'validation' })
export class ServiceRequestPaymentPlanDto {
  @ApiProperty({ enum: SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES })
  @IsIn(SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES)
  strategy: 'single' | 'initial_final' | 'milestone_installments';

  @ApiProperty({ example: '30% inicial y 70% al finalizar', maxLength: 240 })
  @IsString()
  @MaxLength(240)
  summary: string;

  @ApiProperty({ maxLength: 1200 })
  @IsString()
  @MaxLength(1200)
  rationale: string;

  @ApiProperty({ type: () => [ServiceRequestPaymentInstallmentDto], minItems: 1, maxItems: 6 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestPaymentInstallmentDto)
  installments: ServiceRequestPaymentInstallmentDto[];
}

export function parsePaymentPlan({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return plainToInstance(ServiceRequestPaymentPlanDto, parsed);
  } catch {
    return value;
  }
}

@Trace({ type: 'validation' })
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

export function parseMilestoneArray({ value }: TransformFnParams): unknown {
  const parsed = parseJsonArrayValue(value);
  return Array.isArray(parsed) ? plainToInstance(ServiceRequestMilestoneCreateDto, parsed) : parsed;
}

@Trace({ type: 'validation' })
export class ServiceRequestCreateDto {
  @ApiPropertyOptional({ description: 'Tarea del acta que originó la solicitud', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  sourceTaskId?: number;

  @ApiPropertyOptional({ description: 'Oferta del catálogo que originó la solicitud', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  serviceOfferId?: number;

  @ApiProperty({ type: [Number], example: [8, 12, 19], minItems: 1, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ArrayUnique()
  @Transform(parseNumberArray)
  @IsInt({ each: true })
  consultantIds: number[];

  @ApiProperty({ type: () => [ServiceRequestInitialMeetingOptionDto], minItems: 1, maxItems: 3 })
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

  @ApiProperty({ enum: serviceRequestCategoryEnum.enumValues, example: 'Marketing' })
  @IsIn(serviceRequestCategoryEnum.enumValues)
  category: (typeof serviceRequestCategoryEnum.enumValues)[number];

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

  @ApiProperty({ enum: serviceRequestBudgetTypeEnum.enumValues })
  @IsIn(serviceRequestBudgetTypeEnum.enumValues)
  budgetType: (typeof serviceRequestBudgetTypeEnum.enumValues)[number];

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

  @ApiProperty({ enum: serviceRequestWorkModalityEnum.enumValues, example: 'remote' })
  @IsIn(serviceRequestWorkModalityEnum.enumValues)
  workModality: (typeof serviceRequestWorkModalityEnum.enumValues)[number];

  @ApiProperty({ example: 'Una reunión semanal y coordinación asíncrona por correo.', maxLength: 5000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  workMethod: string;

  @ApiPropertyOptional({ type: () => [ServiceRequestMilestoneCreateDto], maxItems: 20 })
  @IsArray()
  @ArrayMaxSize(20)
  @Transform(parseMilestoneArray)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestMilestoneCreateDto)
  @IsOptional()
  milestones?: ServiceRequestMilestoneCreateDto[];

  @ApiProperty({ type: () => ServiceRequestPaymentPlanDto })
  @ValidateNested()
  @Type(() => ServiceRequestPaymentPlanDto)
  @Transform(parsePaymentPlan)
  paymentPlan: ServiceRequestPaymentPlanDto;

  @ApiPropertyOptional({ example: 'Disponibilidad durante la segunda semana del mes.', maxLength: 5000 })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  details?: string;
}

@Trace({ type: 'validation' })
export class ServiceRequestCreateMultipartDto extends ServiceRequestCreateDto {
  @ApiPropertyOptional({
    description: 'Hasta 5 archivos de referencia de máximo 10 MB cada uno',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files?: string[];
}
