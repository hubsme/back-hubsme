import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

@Trace({ type: 'validation' })
export class TaskStatusDto {
  @ApiProperty({ enum: ['pendiente', 'en_progreso', 'completada', 'bloqueada'] })
  @IsIn(['pendiente', 'en_progreso', 'completada', 'bloqueada'])
  status: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
}
