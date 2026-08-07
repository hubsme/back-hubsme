import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
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

export class ServiceRequestDraftDto {
  @ApiProperty({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: ['', ...SERVICE_REQUEST_CATEGORIES] })
  @IsIn(['', ...SERVICE_REQUEST_CATEGORIES])
  category: ServiceRequestCategory | '';

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

  @ApiProperty({ enum: ['', ...SERVICE_REQUEST_BUDGET_TYPES] })
  @IsIn(['', ...SERVICE_REQUEST_BUDGET_TYPES])
  budgetType: ServiceRequestBudgetType | '';

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

  @ApiProperty({ enum: SERVICE_REQUEST_WORK_MODALITIES })
  @IsIn(SERVICE_REQUEST_WORK_MODALITIES)
  workModality: ServiceRequestWorkModality;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  workMethod: string;

  @ApiProperty({ type: [ServiceRequestMilestoneDraftDto], maxItems: 20 })
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
