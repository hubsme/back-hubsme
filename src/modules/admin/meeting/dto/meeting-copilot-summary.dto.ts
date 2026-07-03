import { ApiProperty } from '@nestjs/swagger';
import { TaskSuggestionDto } from '../../ai/dto/hubsme-ai/hubsme-ai-result.dto';

export class MeetingCopilotSummaryDto {
  @ApiProperty({ description: 'Acta de reunion estructurada en Markdown' })
  summary: string;

  @ApiProperty({ type: [TaskSuggestionDto], description: 'Listado de compromisos sugeridos para la PYME' })
  tasks: TaskSuggestionDto[];
}
