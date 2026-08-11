import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES,
  SERVICE_REQUEST_PAYMENT_TRIGGERS,
} from '@db/tables/service-request.table';
import type { ServiceRequestPaymentPlanStrategy, ServiceRequestPaymentTrigger } from '@db/tables/service-request.table';

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
  trigger: ServiceRequestPaymentTrigger;

  @ApiProperty({ example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  milestoneIndex: number;
}

export class ServiceRequestPaymentPlanDto {
  @ApiProperty({ enum: SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES })
  @IsIn(SERVICE_REQUEST_PAYMENT_PLAN_STRATEGIES)
  strategy: ServiceRequestPaymentPlanStrategy;

  @ApiProperty({ example: '30% inicial y 70% al finalizar', maxLength: 240 })
  @IsString()
  @MaxLength(240)
  summary: string;

  @ApiProperty({ maxLength: 1200 })
  @IsString()
  @MaxLength(1200)
  rationale: string;

  @ApiProperty({ type: [ServiceRequestPaymentInstallmentDto], minItems: 1, maxItems: 6 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ServiceRequestPaymentInstallmentDto)
  installments: ServiceRequestPaymentInstallmentDto[];
}
