import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto } from '@modules/admin/common/pagination.dto';

export class ConsultantPymeListFiltersDto extends PaginationFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiPropertyOptional({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  @IsIn(['pendiente', 'aceptado', 'rechazado', 'finalizado'])
  @IsOptional()
  status?: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiPropertyOptional({ description: 'Search by PYME name or sector' })
  @IsString()
  @IsOptional()
  search?: string;
}

export class ConsultantPymeMessageListFiltersDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  consultantId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;
}
