import { Injectable, NotFoundException } from '@nestjs/common';
import { DiagnosticDocumentDTO } from '@db/tables/diagnostic-document.table';
import { DiagnosticResult } from '@db/tables/diagnostic.table';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { DiagnosticDocumentService } from '../diagnostic-document/diagnostic-document.service';
import { DiagnosticGenerateDto } from './dto/diagnostic-generate.dto';
import { DiagnosticListFiltersDto } from './dto/diagnostic-list.dto';
import { PowerAutomateService } from '../powerautomate/powerautomate.service';

@Injectable()
export class DiagnosticService {
  constructor(
    private readonly diagnosticRepository: DiagnosticRepository,
    private readonly diagnosticDocumentService: DiagnosticDocumentService,
    private readonly powerAutomateService: PowerAutomateService,
  ) {}

  async findAllPaginated(filters: DiagnosticListFiltersDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const { data, total } = await this.diagnosticRepository.findAllPaginated(page, limit, filters);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findOne(id: number) {
    const diagnostic = await this.diagnosticRepository.findOne(id);
    if (!diagnostic) throw new NotFoundException(`Diagnostic with ID ${id} not found`);
    return diagnostic;
  }

  async generate(data: DiagnosticGenerateDto) {
    const baseResult = this.buildDiagnostic(data.pymeData ?? {}, data.responses);
    const result = this.normalizeDiagnosticResult(await this.generateWithAi(data, baseResult), baseResult);
    const diagnostic = await this.diagnosticRepository.create({
      pymeId: data.pymeId,
      responses: data.responses,
      result,
      score: result.puntajeGeneral,
      summary: result.resumenEjecutivo,
    });

    await this.diagnosticDocumentService.createMany(
      this.buildDiagnosticDocuments(data, diagnostic.id, result),
    );

    return diagnostic;
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.diagnosticRepository.delete(id);
  }

  private buildDiagnostic(pymeData: Record<string, unknown>, responses: Record<string, unknown>): DiagnosticResult {
    const responseValues = Object.values(responses).map((value) => String(value ?? ''));
    const averageClosedScore = this.averageClosedScore(responseValues);
    const revenue = this.toNumber(responses.revenue);
    const techLevel = this.toNumber(responses.techLevel) || Math.round(averageClosedScore / 10);
    const employees = this.toNumber(responses.employees ?? pymeData.employees);
    const years = this.toNumber(responses.years ?? pymeData.years);
    const challenges = responseValues.join(' ').toLowerCase();

    const financeScore = this.mixScores(revenue > 1000000 ? 82 : revenue > 300000 ? 68 : 58, averageClosedScore);
    const operationsScore = this.mixScores(Math.min(95, Math.max(35, techLevel * 9 + 20)), averageClosedScore);
    const teamScore = this.mixScores(employees > 20 ? 74 : employees > 5 ? 64 : 56, averageClosedScore);
    const marketScore = this.mixScores(years > 5 ? 76 : years > 2 ? 64 : 58, averageClosedScore);
    const score = Math.round((financeScore + operationsScore + teamScore + marketScore) / 4);
    const businessName = String(pymeData.name ?? 'La PYME');

    const areasEvaluadas = [
      this.area(
        'Finanzas',
        financeScore,
        'Los ingresos muestran capacidad de sostener mejoras si se ordena la gestion financiera.',
      ),
      this.area(
        'Operaciones',
        operationsScore,
        'El nivel de digitalizacion define el mayor potencial de productividad inmediata.',
      ),
      this.area(
        'Equipo',
        teamScore,
        'La estructura del equipo requiere rituales de seguimiento y responsables claros.',
      ),
      this.area(
        'Mercado',
        marketScore,
        'La posicion comercial puede fortalecerse con segmentacion y oferta consultiva.',
      ),
    ];

    const problemasCriticos = [
      {
        problema: challenges.includes('liquidez') ? 'Presion de liquidez' : 'Falta de foco operativo',
        impacto: challenges || 'Puede ralentizar la ejecucion de iniciativas estrategicas.',
        urgencia: score < 60 ? 'alta' : 'media',
      },
      {
        problema: 'Baja trazabilidad de acuerdos',
        impacto: 'Sin tareas y responsables claros se pierde continuidad entre sesiones.',
        urgencia: 'media',
      },
    ] as DiagnosticResult['problemasCriticos'];

    const recomendaciones = [
      {
        accion: 'Priorizar un tablero de tareas con responsables y fechas de cierre',
        beneficioEsperado: 'Mayor continuidad entre diagnostico, reuniones y ejecucion.',
        plazo: 'inmediato',
        prioridad: 'alta',
      },
      {
        accion: 'Estandarizar metricas semanales de ventas, caja y operaciones',
        beneficioEsperado: 'Mejor visibilidad para decidir con datos y detectar bloqueos temprano.',
        plazo: '30dias',
        prioridad: 'alta',
      },
      {
        accion: 'Agendar una sesion con consultor especialista del sector',
        beneficioEsperado: 'Validar oportunidades de mejora con experiencia externa puntual.',
        plazo: '30dias',
        prioridad: 'media',
      },
    ] as DiagnosticResult['recomendaciones'];

    return {
      resumenEjecutivo: `${businessName} obtiene un puntaje de ${score}/100. El foco recomendado es convertir los hallazgos en tareas medibles y sesiones de seguimiento con consultores especializados.`,
      puntajeGeneral: score,
      feedbackIa:
        score >= 75
          ? 'La empresa muestra bases saludables para acelerar crecimiento con mejoras puntuales y seguimiento disciplinado.'
          : score >= 60
            ? 'La empresa tiene avances relevantes, pero necesita ordenar prioridades, responsables e indicadores para crecer con menor friccion.'
            : 'La empresa requiere estabilizar gestion, caja y procesos antes de escalar nuevas iniciativas.',
      areasEvaluadas,
      problemasCriticos,
      recomendaciones,
      proximosPasos: [
        'Crear las primeras tareas de mejora con fecha limite.',
        'Elegir consultor segun especialidad y sector.',
        'Revisar el avance del tablero en la siguiente reunion.',
      ],
    };
  }

  private async generateWithAi(data: DiagnosticGenerateDto, baseResult: DiagnosticResult): Promise<DiagnosticResult | null> {
    const prompt = `
      Eres un consultor empresarial senior especializado en PYMES latinoamericanas.
      Analiza los datos, respuestas cerradas y abiertas de la PYME. Ya existe un score base calculado por Hubsme.
      Usa ese score como referencia, ajustalo solo si las respuestas abiertas justifican claramente un cambio.
      El campo feedbackIa debe ser el DIAGNOSTICO GENERAL: un analisis consultivo concreto de 2 a 4 parrafos cortos,
      basado en las respuestas reales, conectando finanzas, operaciones, equipo y mercado. No repitas el resumen ejecutivo.
      Evita texto generico y evita promesas legales, financieras o tributarias absolutas.
      areasEvaluadas debe contener exactamente estas 4 areas y en este orden: Finanzas, Operaciones, Equipo, Mercado.
      Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura y en español. No incluyas introducciones, explicaciones ni bloques de código markdown (como \`\`\`json). Solo devuelve el JSON puro:
      {
        "resumenEjecutivo": "string",
        "puntajeGeneral": number,
        "feedbackIa": "string",
        "areasEvaluadas": [
          { "area": "string", "puntaje": number, "estado": "critico|mejorable|aceptable|fortaleza", "hallazgo": "string" }
        ],
        "problemasCriticos": [
          { "problema": "string", "impacto": "string", "urgencia": "alta|media|baja" }
        ],
        "recomendaciones": [
          { "accion": "string", "beneficioEsperado": "string", "plazo": "inmediato|30dias|90dias|6meses", "prioridad": "alta|media|baja" }
        ],
        "proximosPasos": ["string"]
      }
    `;

    const text = `
      DATOS_EMPRESA=${JSON.stringify(data.pymeData ?? {})}
      RESPUESTAS=${JSON.stringify(data.responses)}
      SCORE_BASE=${JSON.stringify(baseResult)}
    `;

    try {
      const response = await this.powerAutomateService.runPrompt(text, prompt);
      const jsonMatch = response.result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se encontró un bloque JSON válido en la respuesta de la IA de Power Automate.');
      }
      return JSON.parse(jsonMatch[0]) as DiagnosticResult;
    } catch (error: any) {
      console.error('Error al generar diagnóstico con Power Automate:', error);
      return null;
    }
  }

  private buildDiagnosticDocuments(
    data: DiagnosticGenerateDto,
    diagnosticId: number,
    result: DiagnosticResult,
  ): DiagnosticDocumentDTO[] {
    const businessName = String(data.pymeData?.name ?? 'PYME');
    const createdAt = new Date().toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const responses = Object.entries(data.responses)
      .map(([question, answer]) => `- **${question}:** ${String(answer || 'No respondido')}`)
      .join('\n');
    const areas = result.areasEvaluadas
      .map((area) => `- **${area.area} (${area.puntaje}/100, ${area.estado}):** ${area.hallazgo}`)
      .join('\n');
    const problems = result.problemasCriticos
      .map((problem) => `- **${problem.problema} (${problem.urgencia}):** ${problem.impacto}`)
      .join('\n');
    const recommendations = result.recomendaciones
      .map(
        (recommendation) =>
          `- **${recommendation.accion}** (${recommendation.prioridad}, ${recommendation.plazo}): ${recommendation.beneficioEsperado}`,
      )
      .join('\n');
    const nextSteps = result.proximosPasos.map((step) => `- ${step}`).join('\n');

    return [
      {
        diagnosticId,
        pymeId: data.pymeId,
        title: 'Diagnostico empresarial Hubsme',
        type: 'informe',
        content: `# Diagnostico empresarial Hubsme

## Datos del documento
- **Empresa:** ${businessName}
- **Fecha de generacion:** ${createdAt}
- **Puntaje general:** ${result.puntajeGeneral}/100

## Resumen ejecutivo
${result.resumenEjecutivo}

## Diagnostico general
${result.feedbackIa}

## Areas evaluadas
${areas}

## Problemas criticos
${problems}

## Recomendaciones priorizadas
${recommendations}

## Proximos pasos
${nextSteps}

## Respuestas registradas
${responses}
`,
      },
    ];
  }

  private normalizeDiagnosticResult(
    result: DiagnosticResult | null,
    fallback: DiagnosticResult,
  ): DiagnosticResult {
    if (!result) return fallback;

    return {
      resumenEjecutivo: result.resumenEjecutivo || fallback.resumenEjecutivo,
      puntajeGeneral: Number.isFinite(result.puntajeGeneral) ? result.puntajeGeneral : fallback.puntajeGeneral,
      feedbackIa: result.feedbackIa || fallback.feedbackIa,
      areasEvaluadas: this.normalizeAreas(result.areasEvaluadas, fallback.areasEvaluadas),
      problemasCriticos: Array.isArray(result.problemasCriticos) && result.problemasCriticos.length
        ? result.problemasCriticos
        : fallback.problemasCriticos,
      recomendaciones: Array.isArray(result.recomendaciones) && result.recomendaciones.length
        ? result.recomendaciones
        : fallback.recomendaciones,
      proximosPasos: Array.isArray(result.proximosPasos) && result.proximosPasos.length
        ? result.proximosPasos
        : fallback.proximosPasos,
    };
  }

  private area(area: string, puntaje: number, hallazgo: string) {
    return {
      area,
      puntaje,
      estado: puntaje >= 80 ? 'fortaleza' : puntaje >= 65 ? 'aceptable' : puntaje >= 50 ? 'mejorable' : 'critico',
      hallazgo,
    };
  }

  private normalizeAreas(
    areas: DiagnosticResult['areasEvaluadas'] | undefined,
    fallbackAreas: DiagnosticResult['areasEvaluadas'],
  ) {
    const desiredAreas = ['Finanzas', 'Operaciones', 'Equipo', 'Mercado'];
    const source = Array.isArray(areas) ? areas : [];

    return desiredAreas.map((desiredArea) => {
      const normalizedDesired = this.normalizeText(desiredArea);
      const area = source.find((item) => {
        const normalizedArea = this.normalizeText(item.area);
        return (
          normalizedArea.includes(normalizedDesired) ||
          (desiredArea === 'Mercado' && normalizedArea.includes('comercial')) ||
          (desiredArea === 'Equipo' && normalizedArea.includes('rrhh'))
        );
      });

      return area ?? fallbackAreas.find((item) => item.area === desiredArea) ?? this.area(desiredArea, 50, 'Sin hallazgo disponible.');
    });
  }

  private normalizeText(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private toNumber(value: unknown): number {
    const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private averageClosedScore(values: string[]): number {
    const scored = values
      .map((value) => this.closedAnswerScore(value))
      .filter((value): value is number => value !== null);

    if (!scored.length) return 62;
    return Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length);
  }

  private closedAnswerScore(value: string): number | null {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (!normalized.trim()) return null;

    if (
      normalized.includes('desconozco') ||
      normalized.includes('no tiene') ||
      normalized.includes('no revisa') ||
      normalized.includes('no conoce') ||
      normalized.includes('no realiza') ||
      normalized.includes('no capacita') ||
      normalized.includes('desorden') ||
      normalized.includes('problemas frecuentes') ||
      normalized.includes('incumplimientos') ||
      normalized.includes('informalidad') ||
      normalized.includes('todo depende') ||
      normalized.includes('todo se maneja manualmente') ||
      normalized.includes('depende excesivamente')
    ) {
      return 38;
    }

    if (
      normalized.includes('parcial') ||
      normalized.includes('ocasional') ||
      normalized.includes('informal') ||
      normalized.includes('basica') ||
      normalized.includes('idea aproximada') ||
      normalized.includes('algunas areas') ||
      normalized.includes('excel') ||
      normalized.includes('moderada')
    ) {
      return 62;
    }

    if (
      normalized.includes('claro') ||
      normalized.includes('constante') ||
      normalized.includes('ordenado') ||
      normalized.includes('organizado') ||
      normalized.includes('adecuado') ||
      normalized.includes('solidas') ||
      normalized.includes('diversificados') ||
      normalized.includes('activas') ||
      normalized.includes('eficiente') ||
      normalized.includes('completo')
    ) {
      return 84;
    }

    return null;
  }

  private mixScores(base: number, closedScore: number): number {
    return Math.round(base * 0.35 + closedScore * 0.65);
  }
}
