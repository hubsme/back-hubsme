import { ApiProperty } from '@nestjs/swagger';
import { TaskSuggestionDto } from '../../powerautomate/dto/hubsme-ai/hubsme-ai-result.dto';

export class MeetingCopilotSummaryDto {
  @ApiProperty({ description: 'Resumen en texto plano de la reunión' })
  summary: string;

  @ApiProperty({ type: [TaskSuggestionDto], description: 'Listado de tareas sugeridas extraídas por IA' })
  tasks: TaskSuggestionDto[];
}
