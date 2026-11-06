import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationFiltersDto, PaginationMetaDto } from '@dto/pagination.dto';
import { TaskResultDto } from '@modules/admin/modules/task/dto/find-one.dto';

@Trace({ type: 'validation' })
export class TaskListFiltersDto extends PaginationFiltersDto {
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

  @ApiPropertyOptional({ enum: ['pyme', 'consultor'] })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  assignedTo?: 'pyme' | 'consultor';

  @ApiPropertyOptional({ enum: ['alta', 'media', 'baja'] })
  @IsIn(['alta', 'media', 'baja'])
  @IsOptional()
  priority?: 'alta' | 'media' | 'baja';

  @ApiPropertyOptional({ enum: ['pendiente', 'en_progreso', 'completada', 'bloqueada'] })
  @IsIn(['pendiente', 'en_progreso', 'completada', 'bloqueada'])
  @IsOptional()
  status?: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
}

@Trace({ type: 'validation' })
export class TaskListDto {
  @ApiProperty({ type: () => [TaskResultDto] })
  data: TaskResultDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}
