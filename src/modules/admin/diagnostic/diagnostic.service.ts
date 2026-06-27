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
    // 1. Estratégica (Q1, Q2, Q3) -> Max 15
    const q1 = this.getScoreFor(responses, ['objetivos', '12 meses']);
    const q2 = this.getScoreFor(responses, ['resultados', 'revisa']);
    const q3 = this.getScoreFor(responses, ['preparada', 'crecer']);
    const estrategicaSum = q1 + q2 + q3;
    const estrategicaScore = Math.round((estrategicaSum / 15) * 100);

    // 2. Financiera (Q4, Q5, Q6) -> Max 15
    const q4 = this.getScoreFor(responses, ['exactitud', 'gana']);
    const q5 = this.getScoreFor(responses, ['caja', 'cobranzas']);
    const q6 = this.getScoreFor(responses, ['financia', 'crecimiento']);
    const financieraSum = q4 + q5 + q6;
    const financieraScore = Math.round((financieraSum / 15) * 100);

    // 3. Comercial / Ventas (Q7, Q8, Q9) -> Max 15
    const q7 = this.getScoreFor(responses, ['depende', 'pocos clientes']);
    const q8 = this.getScoreFor(responses, ['conseguir', 'cotizar']);
    const q9 = this.getScoreFor(responses, ['seguimiento', 'potenciales']);
    const comercialSum = q7 + q8 + q9;
    const comercialScore = Math.round((comercialSum / 15) * 100);

    // 4. Marketing (Q10) -> Max 5
    const q10 = this.getScoreFor(responses, ['presencia digital', 'marketing']);
    const marketingScore = Math.round((q10 / 5) * 100);

    // 5. Servicio al cliente (Q11) -> Max 5
    const q11 = this.getScoreFor(responses, ['satisfaccion', 'clientes']);
    const servicioScore = Math.round((q11 / 5) * 100);

    // 6. Operaciones (Q12, Q13*, Q14) -> Max 15 o 10
    const q12 = this.getScoreFor(responses, ['procesos', 'ordenados', 'repetibles']);
    const q13 = this.getScoreFor(responses, ['inventarios', 'entrega']);
    const q14 = this.getScoreFor(responses, ['problemas', 'errores', 'reprocesos']);
    
    let operacionesSum = q12 + q14;
    let operacionesMax = 10;
    if (q13 !== -1) {
      operacionesSum += q13;
      operacionesMax = 15;
    }
    const operacionesScore = Math.round((operacionesSum / operacionesMax) * 100);

    // 7. Organizacional / RRHH (Q15, Q16, Q17) -> Max 15
    const q15 = this.getScoreFor(responses, ['funciones', 'responsabilidades']);
    const q16 = this.getScoreFor(responses, ['dueno no esta', 'semana']);
    const q17 = this.getScoreFor(responses, ['capacita', 'personal']);
    const rrhhSum = q15 + q16 + q17;
    const rrhhScore = Math.round((rrhhSum / 15) * 100);

    // 8. Tecnología (Q18) -> Max 5
    const q18 = this.getScoreFor(responses, ['herramientas digitales', 'gestionar']);
    const tecnologiaScore = Math.round((q18 / 5) * 100);

    // 9. Legal (Q19) -> Max 5
    const q19 = this.getScoreFor(responses, ['contratos', 'documentos legales']);
    const legalScore = Math.round((q19 / 5) * 100);

    // 10. Laboral (Q20) -> Max 5
    const q20 = this.getScoreFor(responses, ['obligaciones laborales', 'planilla']);
    const laboralScore = Math.round((q20 / 5) * 100);

    // 11. Tributario / Contable (Q21) -> Max 5
    const q21 = this.getScoreFor(responses, ['obligaciones tributarias', 'sunat']);
    const tributarioScore = Math.round((q21 / 5) * 100);

    const totalObtained = estrategicaSum + financieraSum + comercialSum + q10 + q11 + operacionesSum + rrhhSum + q18 + q19 + q20 + q21;
    const totalMax = 15 + 15 + 15 + 5 + 5 + operacionesMax + 15 + 5 + 5 + 5 + 5;
    const score = Math.round((totalObtained / totalMax) * 100);

    const businessName = String(pymeData.name ?? 'La PYME');

    const areasEvaluadas = [
      this.area('Estratégica', estrategicaScore, `El negocio cuenta con un nivel de madurez estratégica calificado como: ${this.getEstrategicaStatus(estrategicaSum)}.`),
      this.area('Financiera', financieraScore, `El control financiero actual se interpreta como: ${this.getFinancieraStatus(financieraSum)}.`),
      this.area('Comercial / Ventas', comercialScore, `La estructura del área comercial se evalúa como: ${this.getComercialStatus(comercialSum)}.`),
      this.area('Marketing', marketingScore, `La presencia de marketing se cataloga como: ${this.getMarketingStatus(q10)}.`),
      this.area('Servicio al cliente', servicioScore, `La gestión del servicio al cliente se define como: ${this.getServicioStatus(q11)}.`),
      this.area('Operaciones', operacionesScore, `La eficiencia y control operativo se interpreta como: ${this.getOperacionesStatus(operacionesSum, operacionesMax)}.`),
      this.area('Organizacional / RRHH', rrhhScore, `La estructura organizacional del equipo es calificada como: ${this.getRrhhStatus(rrhhSum)}.`),
      this.area('Tecnología', tecnologiaScore, `El nivel de digitalización tecnológica actual es: ${this.getTecnologiaStatus(q18)}.`),
      this.area('Legal', legalScore, `La documentación legal del negocio se evalúa como: ${this.getLegalStatus(q19)}.`),
      this.area('Laboral', laboralScore, `El cumplimiento de obligaciones laborales es: ${this.getLaboralStatus(q20)}.`),
      this.area('Tributario / Contable', tributarioScore, `El cumplimiento tributario ante SUNAT se evalúa como: ${this.getTributarioStatus(q21)}.`),
    ];

    const challenges = Object.values(responses).map((val) => String(val)).join(' ').toLowerCase();

    const problemasCriticos = [
      {
        problema: challenges.includes('liquidez') ? 'Presión de liquidez' : 'Falta de foco operativo',
        impacto: 'Puede ralentizar la ejecución de iniciativas estratégicas y la toma de decisiones.',
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
        beneficioEsperado: 'Mayor continuidad entre diagnóstico, reuniones y ejecución.',
        plazo: 'inmediato',
        prioridad: 'alta',
      },
      {
        accion: 'Estandarizar métricas semanales de ventas, caja y operaciones',
        beneficioEsperado: 'Mejor visibilidad para decidir con datos y detectar bloqueos temprano.',
        plazo: '30dias',
        prioridad: 'alta',
      },
      {
        accion: 'Agendar una sesión con consultor especialista del sector',
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
            ? 'La empresa tiene avances relevantes, pero necesita ordenar prioridades, responsables e indicadores para crecer con menor fricción.'
            : 'La empresa requiere estabilizar gestión, caja y procesos antes de escalar nuevas iniciativas.',
      areasEvaluadas,
      problemasCriticos,
      recomendaciones,
    };
  }

  private async generateWithAi(data: DiagnosticGenerateDto, baseResult: DiagnosticResult): Promise<DiagnosticResult | null> {
    const prompt = `
      Eres un consultor empresarial senior especializado en PYMES latinoamericanas.
      Analiza los datos, respuestas cerradas y abiertas de la PYME. Ya existe un score base calculado por Hubsme.
      Usa ese score como referencia, ajustalo solo si las respuestas abiertas justifican claramente un cambio.
      El campo feedbackIa debe ser el DIAGNOSTICO GENERAL y debe estar estructurado en español con los siguientes apartados (usando títulos en negritas y párrafos separados):
      - **Puntos Positivos:** Análisis de las fortalezas y aciertos del negocio basados en sus respuestas.
      - **Puntos Negativos y Oportunidades de Mejora:** Análisis de las debilidades, riesgos, cuellos de botella e ineficiencias encontradas.
      - **Conclusión y Ruta Estratégica:** Síntesis consultiva del camino sugerido para estabilizar y crecer.
      
      No repitas el resumen ejecutivo. Evita texto genérico y evita promesas legales o financieras absolutas.
      areasEvaluadas debe contener exactamente estas 11 areas y en este orden: Estratégica, Financiera, Comercial / Ventas, Marketing, Servicio al cliente, Operaciones, Organizacional / RRHH, Tecnología, Legal, Laboral, Tributario / Contable.
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
        ]
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
    const desiredAreas = [
      'Estratégica',
      'Financiera',
      'Comercial / Ventas',
      'Marketing',
      'Servicio al cliente',
      'Operaciones',
      'Organizacional / RRHH',
      'Tecnología',
      'Legal',
      'Laboral',
      'Tributario / Contable',
    ];
    const source = Array.isArray(areas) ? areas : [];

    return desiredAreas.map((desiredArea) => {
      const normalizedDesired = this.normalizeText(desiredArea);
      const area = source.find((item) => {
        const normalizedArea = this.normalizeText(item.area);
        return (
          normalizedArea.includes(normalizedDesired) ||
          (desiredArea === 'Comercial / Ventas' && normalizedArea.includes('comerc')) ||
          (desiredArea === 'Organizacional / RRHH' && (normalizedArea.includes('rrhh') || normalizedArea.includes('organi'))) ||
          (desiredArea === 'Tributario / Contable' && normalizedArea.includes('tribut'))
        );
      });

      return area ?? fallbackAreas.find((item) => item.area === desiredArea) ?? this.area(desiredArea, 50, 'Sin hallazgo disponible.');
    });
  }

  private getScoreFor(responses: Record<string, unknown>, keywords: string[]): number {
    const entry = Object.entries(responses).find(([key]) => {
      const normalizedKey = this.normalizeText(key);
      return keywords.every(kw => normalizedKey.includes(kw));
    });
    if (!entry) return 3;
    const value = String(entry[1] ?? '');
    if (value.includes('N/A')) return -1;
    const match = value.match(/\((\d)\)/);
    return match ? Number(match[1]) : 3;
  }

  private getEstrategicaStatus(sum: number): string {
    if (sum >= 13) return 'Visión clara';
    if (sum >= 9) return 'Parcialmente estructurada';
    if (sum >= 5) return 'Reactiva';
    return 'Sin dirección';
  }

  private getFinancieraStatus(sum: number): string {
    if (sum >= 13) return 'Gestión sólida';
    if (sum >= 9) return 'Gestión aceptable';
    if (sum >= 5) return 'Control básico';
    return 'Riesgo financiero alto';
  }

  private getComercialStatus(sum: number): string {
    if (sum >= 13) return 'Organizada';
    if (sum >= 9) return 'Parcialmente estructurada';
    if (sum >= 5) return 'Informal';
    return 'Ventas desordenadas';
  }

  private getMarketingStatus(sum: number): string {
    if (sum >= 4) return 'Activo y funcional';
    if (sum >= 2) return 'Básico';
    return 'Sin presencia';
  }

  private getServicioStatus(sum: number): string {
    if (sum >= 4) return 'Activo';
    if (sum >= 2) return 'Reactivo';
    return 'Sin gestión';
  }

  private getOperacionesStatus(sum: number, max: number): string {
    const scaled = (sum / max) * 15;
    if (scaled >= 13) return 'Eficiente';
    if (scaled >= 9) return 'Parcialmente organizada';
    if (scaled >= 5) return 'Control básico';
    return 'Desordenada';
  }

  private getRrhhStatus(sum: number): string {
    if (sum >= 13) return 'Sólida';
    if (sum >= 9) return 'Parcialmente estructurada';
    if (sum >= 5) return 'Informal';
    return 'Dependiente del dueño';
  }

  private getTecnologiaStatus(sum: number): string {
    if (sum >= 5) return 'Sistema integrado';
    if (sum >= 4) return 'Software especializado';
    if (sum >= 3) return 'Apps básicas';
    if (sum >= 2) return 'Excel';
    return 'Manual';
  }

  private getLegalStatus(sum: number): string {
    if (sum >= 4) return 'Ordenada';
    if (sum >= 2) return 'Básico';
    return 'Riesgo alto';
  }

  private getLaboralStatus(sum: number): string {
    if (sum >= 4) return 'Cumplimiento adecuado';
    if (sum >= 2) return 'Parcial';
    return 'Riesgo alto';
  }

  private getTributarioStatus(sum: number): string {
    if (sum >= 4) return 'Ordenado';
    if (sum >= 2) return 'Parcial';
    return 'Riesgo alto';
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
