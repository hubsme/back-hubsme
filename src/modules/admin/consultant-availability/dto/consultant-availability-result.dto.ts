import { ApiProperty } from '@nestjs/swagger';

export class ConsultantAvailabilityResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ enum: ['disponible', 'bloqueado'] })
  status: 'disponible' | 'bloqueado';

  @ApiProperty({ nullable: true })
  notes: string | null;
}
