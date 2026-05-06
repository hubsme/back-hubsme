import { ApiProperty } from '@nestjs/swagger';
import { TaskResultDto } from '@modules/admin/task/dto/task-result.dto';

export class MeetingMinutesDto {
  @ApiProperty()
  titulo: string;

  @ApiProperty()
  resumen: string;

  @ApiProperty({ type: [String] })
  puntosTratados: string[];

  @ApiProperty({ type: [Object] })
  acuerdos: { descripcion: string; responsable: string; fechaLimite?: string }[];

  @ApiProperty({ type: [Object] })
  tareasGeneradas: { titulo: string; descripcion: string; asignadoA: string; prioridad: string }[];
}

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

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ type: MeetingMinutesDto, nullable: true })
  minutes: MeetingMinutesDto | null;

  @ApiProperty({ nullable: true })
  completedAt: Date | null;
}

export class MeetingFinalizeResultDto {
  @ApiProperty({ type: MeetingResultDto })
  meeting: MeetingResultDto;

  @ApiProperty({ type: [TaskResultDto] })
  tasks: TaskResultDto[];
}
