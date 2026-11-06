import { Trace } from '@erixcel/traceflow';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsArray, ValidateNested } from 'class-validator';
import { TaskResultDto } from '@modules/admin/modules/task/dto/find-one.dto';
import { MeetingResultDto } from '@modules/admin/modules/meeting/dto/find-one.dto';

@Trace({ type: 'validation' })
export class MeetingFinalizeTaskDto {
  @ApiPropertyOptional({ description: 'ID de la tarea existente al editar un acta', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Preparar propuesta de optimizacion' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Detallar alcance, tiempos y siguientes pasos.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], example: 'consultor' })
  @IsIn(['pyme', 'consultor'])
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'], example: 'media' })
  @IsIn(['alta', 'media', 'baja'])
  priority: 'alta' | 'media' | 'baja';

  @ApiPropertyOptional({
    enum: ['pendiente', 'en_progreso', 'completada', 'bloqueada'],
    default: 'pendiente',
  })
  @IsOptional()
  @IsIn(['pendiente', 'en_progreso', 'completada', 'bloqueada'])
  status?: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';

  @ApiProperty({ required: false, example: '2026-05-23T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  dueDate?: string;
}

@Trace({ type: 'validation' })
export class MeetingFinalizeDto {
  @ApiProperty({
    description: 'Acta completa en formato Markdown.',
    example:
      '## Resumen\nSe reviso el estado actual del negocio.\n\n## Acuerdos\n- El consultor preparara una propuesta.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ type: () => [MeetingFinalizeTaskDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeetingFinalizeTaskDto)
  tasks?: MeetingFinalizeTaskDto[];
}

@Trace({ type: 'validation' })
export class MeetingFinalizeResultDto {
  @ApiProperty({ type: () => MeetingResultDto })
  meeting: MeetingResultDto;

  @ApiProperty({ type: () => [TaskResultDto] })
  tasks: TaskResultDto[];
}
