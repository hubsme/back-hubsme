import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { PromotionCodeResultDto } from '@modules/admin/modules/promotion-code/controllers/promotion-code-admin/dto/create.dto';

@Trace({ type: 'validation' })
export class PromotionCodeListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}

@Trace({ type: 'validation' })
export class PromotionCodeListDto {
  @ApiProperty({ type: () => [PromotionCodeResultDto] })
  data: PromotionCodeResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
