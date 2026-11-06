import { serviceRequestCategoryEnum } from '@db/tables/service-request.table';
import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { ConsultantServiceOfferResultDto } from '@modules/admin/modules/consultant-service-offer/dto/find-one.dto';

@Trace({ type: 'validation' })
export class ConsultantServiceOfferListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ maxLength: 160 })
  @IsString()
  @MaxLength(160)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: serviceRequestCategoryEnum.enumValues })
  @IsIn(serviceRequestCategoryEnum.enumValues)
  @IsOptional()
  category?: (typeof serviceRequestCategoryEnum.enumValues)[number];

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

@Trace({ type: 'validation' })
export class ConsultantServiceOfferListDto {
  @ApiProperty({ type: () => [ConsultantServiceOfferResultDto] })
  data: ConsultantServiceOfferResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
