import { consultantServiceOfferPricePeriodEnum } from '@db/tables/consultant-service-offer.table';
import { serviceRequestCategoryEnum, serviceRequestWorkModalityEnum } from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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

@Trace({ type: 'validation' })
export class ConsultantServiceOfferCreateDto {
  @ApiProperty({ example: 'Contabilidad mensual para PYMEs', maxLength: 160 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty({ enum: serviceRequestCategoryEnum.enumValues, example: 'Tributario / Contable' })
  @IsIn(serviceRequestCategoryEnum.enumValues)
  category: (typeof serviceRequestCategoryEnum.enumValues)[number];

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

  @ApiProperty({ enum: serviceRequestWorkModalityEnum.enumValues, example: 'remote' })
  @IsIn(serviceRequestWorkModalityEnum.enumValues)
  workModality: (typeof serviceRequestWorkModalityEnum.enumValues)[number];

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

  @ApiProperty({ enum: consultantServiceOfferPricePeriodEnum.enumValues, example: 'monthly' })
  @IsIn(consultantServiceOfferPricePeriodEnum.enumValues)
  pricePeriod: (typeof consultantServiceOfferPricePeriodEnum.enumValues)[number];
}
