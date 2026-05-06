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

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: DashboardTaskStatusDto })
  taskStatus: DashboardTaskStatusDto;

  @ApiProperty({ type: [DashboardMeetingDto] })
  upcomingMeetings: DashboardMeetingDto[];
}
