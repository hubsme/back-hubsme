import { ApiProperty } from '@nestjs/swagger';
import { TaskResultDto } from '@modules/admin/task/dto/task-result.dto';

export class MeetingResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ nullable: true })
  meetingUrl: string | null;

  @ApiProperty({ enum: ['solicitada', 'confirmada', 'finalizada', 'cancelada'] })
  status: 'solicitada' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  requestedBy: 'pyme' | 'consultor';

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: [TaskResultDto], required: false })
  tasks?: TaskResultDto[];
}

export class MeetingFinalizeResultDto {
  @ApiProperty({ type: MeetingResultDto })
  meeting: MeetingResultDto;

  @ApiProperty({ type: [TaskResultDto] })
  tasks: TaskResultDto[];
}
