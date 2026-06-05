import { ApiProperty } from '@nestjs/swagger';

export class DiagnosticDocumentResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  diagnosticId: number;

  @ApiProperty()
  pymeId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: ['informe', 'plan_accion', 'respuestas'] })
  type: 'informe' | 'plan_accion' | 'respuestas';

  @ApiProperty()
  content: string;
}
