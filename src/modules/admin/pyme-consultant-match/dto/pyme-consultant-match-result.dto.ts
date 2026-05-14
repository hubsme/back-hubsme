import { ApiProperty } from '@nestjs/swagger';

export class PymeConsultantMatchResultDto {
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

  @ApiProperty({ nullable: true })
  pymeName: string | null;

  @ApiProperty()
  consultantId: number;

  @ApiProperty({ nullable: true })
  consultantName: string | null;

  @ApiProperty({ enum: ['pendiente', 'aceptado', 'rechazado', 'finalizado'] })
  status: 'pendiente' | 'aceptado' | 'rechazado' | 'finalizado';

  @ApiProperty()
  source: string;

  @ApiProperty({ nullable: true })
  notes: string | null;
}
