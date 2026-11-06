import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';

@Trace({ type: 'validation' })
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

@Trace({ type: 'validation' })
export class UserListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  firstName: string | null;

  @ApiProperty({ nullable: true })
  lastName: string | null;

  @ApiProperty({ enum: ['admin', 'pyme', 'consultor'] })
  role: 'admin' | 'pyme' | 'consultor';

  @ApiProperty({ enum: ['local', 'google'] })
  authProvider: 'local' | 'google';

  @ApiProperty({ enum: ['true', 'false'] })
  isActive: string;

  @ApiProperty()
  createdAt: Date;
}

@Trace({ type: 'validation' })
export class UserListDto {
  @ApiProperty({ type: () => [UserListItemDto] })
  data: UserListItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
