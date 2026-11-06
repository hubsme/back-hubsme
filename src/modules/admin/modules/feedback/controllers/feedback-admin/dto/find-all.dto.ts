import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { FeedbackListFiltersDto } from '@modules/admin/modules/feedback/dto/find-all.dto';

@Trace({ type: 'validation' })
export class FeedbackAdminListFiltersDto extends FeedbackListFiltersDto {
  @ApiPropertyOptional({ description: 'Buscar por título, descripción, usuario o correo' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['pyme', 'consultor'] })
  @IsIn(['pyme', 'consultor'])
  @IsOptional()
  userRole?: 'pyme' | 'consultor';
}
