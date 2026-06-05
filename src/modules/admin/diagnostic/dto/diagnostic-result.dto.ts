import { ApiProperty } from '@nestjs/swagger';

export class DiagnosticAreaDto {
  @ApiProperty()
  area: string;

  @ApiProperty()
  puntaje: number;

  @ApiProperty()
  estado: string;

  @ApiProperty()
  hallazgo: string;
}

export class DiagnosticProblemDto {
  @ApiProperty()
  problema: string;

  @ApiProperty()
  impacto: string;

  @ApiProperty({ enum: ['alta', 'media', 'baja'] })
  urgencia: 'alta' | 'media' | 'baja';
}

export class DiagnosticRecommendationDto {
  @ApiProperty()
  accion: string;

  @ApiProperty()
  beneficioEsperado: string;

  @ApiProperty()
  plazo: string;

  @ApiProperty({ enum: ['alta', 'media', 'baja'] })
  prioridad: 'alta' | 'media' | 'baja';
}

export class DiagnosticPayloadDto {
  @ApiProperty()
  resumenEjecutivo: string;

  @ApiProperty()
  puntajeGeneral: number;

  @ApiProperty()
  feedbackIa: string;

  @ApiProperty({ type: [DiagnosticAreaDto] })
  areasEvaluadas: DiagnosticAreaDto[];

  @ApiProperty({ type: [DiagnosticProblemDto] })
  problemasCriticos: DiagnosticProblemDto[];

  @ApiProperty({ type: [DiagnosticRecommendationDto] })
  recomendaciones: DiagnosticRecommendationDto[];

  @ApiProperty({ type: [String] })
  proximosPasos: string[];
}

export class DiagnosticResultDto {
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

  @ApiProperty({ type: Object })
  responses: Record<string, unknown>;

  @ApiProperty({ type: DiagnosticPayloadDto })
  result: DiagnosticPayloadDto;

  @ApiProperty()
  score: number;

  @ApiProperty()
  summary: string;
}
