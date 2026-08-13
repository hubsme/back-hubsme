import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CONSULTANT_SERVICE_OFFER_PRICE_PERIODS } from '@db/tables/consultant-service-offer.table';
import { SERVICE_REQUEST_CATEGORIES, SERVICE_REQUEST_WORK_MODALITIES } from '@db/tables/service-request.table';
import type { ConsultantServiceOfferPricePeriod } from '@db/tables/consultant-service-offer.table';
import type { ServiceRequestCategory, ServiceRequestWorkModality } from '@db/tables/service-request.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class ConsultantServiceOfferCreateDto {
  @ApiProperty({ example: 'Contabilidad mensual para PYMEs', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: SERVICE_REQUEST_CATEGORIES, example: 'Tributario / Contable' })
  @IsIn(SERVICE_REQUEST_CATEGORIES)
  category: ServiceRequestCategory;

  @ApiProperty({ example: 'Contabilidad', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  subcategory: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  expectedOutcome: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  requirements: string;

  @ApiProperty({ type: [String], minItems: 1, maxItems: 20 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MinLength(3, { each: true })
  @MaxLength(500, { each: true })
  deliverables: string[];

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  exclusions?: string;

  @ApiProperty({ minimum: 1, maximum: 365, example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  estimatedDurationDays: number;

  @ApiProperty({ enum: SERVICE_REQUEST_WORK_MODALITIES, example: 'remote' })
  @IsIn(SERVICE_REQUEST_WORK_MODALITIES)
  workModality: ServiceRequestWorkModality;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MinLength(5)
  @MaxLength(5000)
  workMethod: string;

  @ApiProperty({ minimum: 0.01, example: 1200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price: number;

  @ApiProperty({ enum: CONSULTANT_SERVICE_OFFER_PRICE_PERIODS, example: 'monthly' })
  @IsIn(CONSULTANT_SERVICE_OFFER_PRICE_PERIODS)
  pricePeriod: ConsultantServiceOfferPricePeriod;
}

export class ConsultantServiceOfferUpdateDto extends PartialType(ConsultantServiceOfferCreateDto) {}

export class ConsultantServiceOfferActiveDto {
  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}

export class ConsultantServiceOfferListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: SERVICE_REQUEST_CATEGORIES })
  @IsIn(SERVICE_REQUEST_CATEGORIES)
  @IsOptional()
  category?: ServiceRequestCategory;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsString()
  @MaxLength(120)
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsIn(['true', 'false'])
  @IsOptional()
  isActive?: 'true' | 'false';
}

export class ConsultantServiceOfferResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  consultantName: string;

  @ApiPropertyOptional({ nullable: true })
  consultantHeadline: string | null;

  @ApiPropertyOptional({ nullable: true })
  consultantPhotoUrl: string | null;

  @ApiProperty()
  consultantRating: string;

  @ApiProperty()
  consultantYearsExperience: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: SERVICE_REQUEST_CATEGORIES })
  category: ServiceRequestCategory;

  @ApiProperty()
  subcategory: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  expectedOutcome: string;

  @ApiProperty()
  requirements: string;

  @ApiProperty({ type: [String] })
  deliverables: string[];

  @ApiPropertyOptional({ nullable: true })
  exclusions: string | null;

  @ApiProperty()
  estimatedDurationDays: number;

  @ApiProperty({ enum: SERVICE_REQUEST_WORK_MODALITIES })
  workModality: ServiceRequestWorkModality;

  @ApiProperty()
  workMethod: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: CONSULTANT_SERVICE_OFFER_PRICE_PERIODS })
  pricePeriod: ConsultantServiceOfferPricePeriod;

  @ApiProperty()
  isActive: boolean;
}

export class ConsultantServiceOfferListDto {
  @ApiProperty({ type: [ConsultantServiceOfferResultDto] })
  data: ConsultantServiceOfferResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
