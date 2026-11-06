import { Trace } from '@erixcel/traceflow';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

@Trace({ type: 'validation' })
export class DashboardFilterDto {
  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ enum: ['admin', 'pyme', 'consultor'] })
  @IsIn(['admin', 'pyme', 'consultor'])
  @IsOptional()
  role?: 'admin' | 'pyme' | 'consultor';
}

@Trace({ type: 'validation' })
export class DashboardStatsDto {
  @ApiProperty()
  clients: number;

  @ApiProperty()
  meetings: number;

  @ApiProperty()
  tasks: number;

  @ApiProperty()
  diagnostics: number;

  @ApiProperty()
  billableHours: number;
}

@Trace({ type: 'validation' })
export class DashboardLatestDiagnosticDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  score: number;
}

@Trace({ type: 'validation' })
export class DashboardMeetingStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  confirmed: number;

  @ApiProperty()
  requested: number;

  @ApiProperty()
  pending: number;

  @ApiProperty({ description: 'Reuniones finalizadas con acta registrada' })
  completed: number;
}

@Trace({ type: 'validation' })
export class DashboardTaskStatusDto {
  @ApiProperty()
  pendiente: number;

  @ApiProperty()
  enProgreso: number;

  @ApiProperty()
  completada: number;

  @ApiProperty()
  bloqueada: number;
}

@Trace({ type: 'validation' })
export class DashboardTaskDeadlineDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  dueDate: Date;

  @ApiProperty({ enum: ['alta', 'media', 'baja'] })
  priority: 'alta' | 'media' | 'baja';

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['pendiente', 'en_progreso', 'bloqueada'] })
  status: 'pendiente' | 'en_progreso' | 'bloqueada';
}

@Trace({ type: 'validation' })
export class DashboardMeetingDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  durationMinutes: number;

  @ApiProperty()
  status: string;
}

@Trace({ type: 'validation' })
export class DashboardWorkloadClientDto {
  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  inProgress: number;
}

@Trace({ type: 'validation' })
export class DashboardAlertDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  client: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: ['danger', 'warning', 'info'] })
  tone: 'danger' | 'warning' | 'info';
}

@Trace({ type: 'validation' })
export class DashboardResponseDto {
  @ApiProperty({ type: () => DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: () => DashboardLatestDiagnosticDto, nullable: true })
  latestDiagnostic: DashboardLatestDiagnosticDto | null;

  @ApiProperty({ type: () => DashboardMeetingStatsDto })
  meetingStats: DashboardMeetingStatsDto;

  @ApiProperty({ type: () => DashboardTaskStatusDto })
  taskStatus: DashboardTaskStatusDto;

  @ApiProperty({ type: () => [DashboardTaskDeadlineDto] })
  upcomingTasks: DashboardTaskDeadlineDto[];

  @ApiProperty({ type: () => [DashboardTaskDeadlineDto] })
  overdueTasks: DashboardTaskDeadlineDto[];

  @ApiProperty({ type: () => [DashboardMeetingDto] })
  upcomingMeetings: DashboardMeetingDto[];

  @ApiProperty({ type: () => [DashboardWorkloadClientDto] })
  workloadByClient: DashboardWorkloadClientDto[];

  @ApiProperty({ type: () => [DashboardAlertDto] })
  alerts: DashboardAlertDto[];
}
