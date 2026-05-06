import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TaskCreateDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  meetingId?: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  pymeId: number;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  consultantId?: number;

  @ApiProperty({ example: 'Implementar CRM de ventas' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Configurar pipeline comercial y migrar la base de datos actual.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], default: 'pyme' })
  @IsIn(['pyme', 'consultor'])
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'], default: 'media' })
  @IsIn(['alta', 'media', 'baja'])
  priority: 'alta' | 'media' | 'baja';

  @ApiPropertyOptional({ enum: ['pendiente', 'en_progreso', 'completada', 'bloqueada'], default: 'pendiente' })
  @IsIn(['pendiente', 'en_progreso', 'completada', 'bloqueada'])
  @IsOptional()
  status?: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';

  @ApiPropertyOptional({ example: '2026-05-20T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;
}
