import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class ConsultantAvailabilityListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startFrom?: Date;

  @ApiPropertyOptional({ example: '2026-06-30T23:59:59.999Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startTo?: Date;

  @ApiPropertyOptional({ enum: ['disponible', 'bloqueado'] })
  @IsIn(['disponible', 'bloqueado'])
  @IsOptional()
  status?: 'disponible' | 'bloqueado';
}

export class ConsultantAvailabilityMonthFiltersDto {
  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2024)
  year: number;

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ enum: ['disponible', 'bloqueado'] })
  @IsIn(['disponible', 'bloqueado'])
  @IsOptional()
  status?: 'disponible' | 'bloqueado';
}

export class ConsultantAvailabilityListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ enum: ['disponible', 'bloqueado'] })
  status: 'disponible' | 'bloqueado';

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: Date;
}

export class ConsultantAvailabilityListDto {
  @ApiProperty({ type: [ConsultantAvailabilityListItemDto] })
  data: ConsultantAvailabilityListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class ConsultantAvailabilityMonthDto {
  @ApiProperty({ type: [ConsultantAvailabilityListItemDto] })
  data: ConsultantAvailabilityListItemDto[];
}
