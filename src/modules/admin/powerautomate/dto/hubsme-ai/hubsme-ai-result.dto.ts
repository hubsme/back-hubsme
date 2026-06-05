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
  @ApiProperty({ description: 'Acta de reunion estructurada en Markdown' })
  summary: string;

  @ApiProperty({ type: [TaskSuggestionDto], description: 'Listado de compromisos sugeridos para la PYME' })
  tasks: TaskSuggestionDto[];
}
