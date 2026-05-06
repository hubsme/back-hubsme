import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@modules/admin/common/pagination.dto';

export class UserListFiltersDto extends PaginationFiltersDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['admin', 'pyme', 'consultor'] })
  @IsIn(['admin', 'pyme', 'consultor'])
  @IsOptional()
  role?: 'admin' | 'pyme' | 'consultor';

  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsIn(['true', 'false'])
  @IsOptional()
  isActive?: string;
}

export class UserListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'] })
  role: 'admin' | 'pyme' | 'consultor';

  @ApiProperty({ enum: ['true', 'false'] })
  isActive: string;

  @ApiProperty()
  createdAt: Date;
}

export class UserListDto {
  @ApiProperty({ type: [UserListItemDto] })
  data: UserListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
