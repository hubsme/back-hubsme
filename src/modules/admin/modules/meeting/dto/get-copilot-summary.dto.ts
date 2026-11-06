import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { TaskSuggestionDto } from '@modules/admin/modules/ai/dto/run-hubsme-ai.dto';

@Trace({ type: 'validation' })
export class MeetingCopilotSummaryDto {
  @ApiProperty({ description: 'Acta de reunion estructurada en Markdown' })
  summary: string;

  @ApiProperty({
    type: () => [TaskSuggestionDto],
    description: 'Listado de compromisos sugeridos para la PYME y el consultor',
  })
  tasks: TaskSuggestionDto[];
}
