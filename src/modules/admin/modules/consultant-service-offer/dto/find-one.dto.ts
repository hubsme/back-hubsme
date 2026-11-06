import { consultantServiceOfferPricePeriodEnum } from '@db/tables/consultant-service-offer.table';
import { serviceRequestCategoryEnum, serviceRequestWorkModalityEnum } from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Trace({ type: 'validation' })
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

  @ApiProperty({ enum: serviceRequestCategoryEnum.enumValues })
  category: (typeof serviceRequestCategoryEnum.enumValues)[number];

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

  @ApiProperty({ enum: serviceRequestWorkModalityEnum.enumValues })
  workModality: (typeof serviceRequestWorkModalityEnum.enumValues)[number];

  @ApiProperty()
  workMethod: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: consultantServiceOfferPricePeriodEnum.enumValues })
  pricePeriod: (typeof consultantServiceOfferPricePeriodEnum.enumValues)[number];

  @ApiProperty()
  isActive: boolean;
}
