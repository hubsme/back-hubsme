import { Trace } from '@erixcel/traceflow';
import { ApiProperty } from '@nestjs/swagger';
import { TaskResultDto } from '@modules/admin/modules/task/dto/find-one.dto';

@Trace({ type: 'validation' })
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

  @ApiProperty({ nullable: true })
  serviceRequestId: number | null;

  @ApiProperty({ nullable: true })
  serviceMilestoneIndex: number | null;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  startTime: Date | null;

  @ApiProperty({ type: [String] })
  proposedStartTimes: string[];

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty({ description: 'Indica si la reunión tiene un acceso virtual configurado' })
  hasMeetingLink: boolean;

  @ApiProperty({ enum: ['solicitada', 'por_confirmar', 'confirmada', 'finalizada', 'cancelada'] })
  status: 'solicitada' | 'por_confirmar' | 'confirmada' | 'finalizada' | 'cancelada';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  requestedBy: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['consultoria', 'servicio'] })
  meetingType: 'consultoria' | 'servicio';

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: () => [TaskResultDto], required: false })
  tasks?: TaskResultDto[];
}
