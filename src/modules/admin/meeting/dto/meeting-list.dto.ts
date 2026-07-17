import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';
import { MeetingResultDto } from './meeting-result.dto';

export class MeetingListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  pymeId?: number;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ enum: ['solicitada', 'pago_pendiente', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  @IsIn(['solicitada', 'pago_pendiente', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'])
  @IsOptional()
  status?: 'solicitada' | 'pago_pendiente' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';
}

export class MeetingListDto {
  @ApiProperty({ type: [MeetingResultDto] })
  data: MeetingResultDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
