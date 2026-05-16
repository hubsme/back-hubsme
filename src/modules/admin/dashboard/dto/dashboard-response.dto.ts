import { ApiProperty } from '@nestjs/swagger';

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

export class DashboardMeetingDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  status: string;
}

export class DashboardWorkloadClientDto {
  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  total: number;

  @ApiProperty()
  completed: number;
}

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

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: DashboardTaskStatusDto })
  taskStatus: DashboardTaskStatusDto;

  @ApiProperty({ type: [DashboardMeetingDto] })
  upcomingMeetings: DashboardMeetingDto[];

  @ApiProperty({ type: [DashboardWorkloadClientDto] })
  workloadByClient: DashboardWorkloadClientDto[];

  @ApiProperty({ type: [DashboardAlertDto] })
  alerts: DashboardAlertDto[];
}
