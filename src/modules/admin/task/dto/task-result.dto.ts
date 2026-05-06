import { ApiProperty } from '@nestjs/swagger';

export class TaskResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  meetingId: number | null;

  @ApiProperty()
  pymeId: number;

  @ApiProperty({ nullable: true })
  consultantId: number | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['pyme', 'consultor'] })
  assignedTo: 'pyme' | 'consultor';

  @ApiProperty({ enum: ['alta', 'media', 'baja'] })
  priority: 'alta' | 'media' | 'baja';

  @ApiProperty({ enum: ['pendiente', 'en_progreso', 'completada', 'bloqueada'] })
  status: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';

  @ApiProperty({ nullable: true })
  dueDate: Date | null;
}
