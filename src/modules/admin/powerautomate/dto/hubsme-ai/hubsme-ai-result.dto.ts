import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskSuggestionDto {
  @ApiProperty({ description: 'Título accionable de la tarea sugerida' })
  title: string;

  @ApiProperty({ description: 'Descripción detallada de la tarea' })
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'], description: 'Responsable asignado' })
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'], description: 'Prioridad de la tarea' })
  priority: 'alta' | 'media' | 'baja';

  @ApiPropertyOptional({ description: 'Fecha límite sugerida en formato YYYY-MM-DD', example: '2026-06-15' })
  dueDate?: string;
}

export class HubsmeAiResultDto {
  @ApiProperty({ description: 'Resumen ejecutivo de la reunión' })
  summary: string;

  @ApiProperty({ type: [TaskSuggestionDto], description: 'Listado de tareas sugeridas extraídas por IA' })
  tasks: TaskSuggestionDto[];
}
