import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class PymeListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by business name or RUC' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by sector' })
  @IsString()
  @IsOptional()
  sector?: string;
}

export class PymeListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  ruc: string | null;

  @ApiProperty({ nullable: true })
  ownerFirstName: string | null;

  @ApiProperty({ nullable: true })
  ownerLastName: string | null;

  @ApiProperty({ nullable: true })
  ownerEmail: string | null;

  @ApiProperty({ nullable: true })
  sector: string | null;

  @ApiProperty({ nullable: true })
  numEmployees: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class PymeListDto {
  @ApiProperty({ type: [PymeListItemDto] })
  data: PymeListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
