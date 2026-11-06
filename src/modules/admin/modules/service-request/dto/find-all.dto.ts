import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { serviceRequestStatusEnum } from '@db/tables/service-request.table';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { ServiceRequestResultDto } from '@modules/admin/modules/service-request/dto/find-one.dto';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class ServiceRequestListDto {
  @ApiProperty({ type: () => [ServiceRequestResultDto] })
  data: ServiceRequestResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
