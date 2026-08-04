import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { serviceRequestStatusEnum } from '@db/tables/service-request.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { ServiceRequestResultDto } from './service-request-result.dto';

export class ServiceRequestListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ enum: ['requests', 'proposals'] })
  @IsIn(['requests', 'proposals'])
  @IsOptional()
  stage?: 'requests' | 'proposals';

  @ApiPropertyOptional({ enum: serviceRequestStatusEnum.enumValues })
  @IsIn(serviceRequestStatusEnum.enumValues)
  @IsOptional()
  status?: (typeof serviceRequestStatusEnum.enumValues)[number];

  @ApiPropertyOptional({ description: 'Buscar por título, descripción o requerimientos' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class ServiceRequestListDto {
  @ApiProperty({ type: [ServiceRequestResultDto] })
  data: ServiceRequestResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
