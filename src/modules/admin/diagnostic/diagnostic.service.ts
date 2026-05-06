import { Injectable, NotFoundException } from '@nestjs/common';
import { DiagnosticResult } from '@db/tables/diagnostic.table';
import { DiagnosticRepository } from '@repositories/diagnostic.repository';
import { GeminiService } from '@modules/admin/common/gemini.service';
import { DiagnosticGenerateDto } from './dto/diagnostic-generate.dto';
import { DiagnosticListFiltersDto } from './dto/diagnostic-list.dto';

@Injectable()
export class DiagnosticService {
  constructor(
    private readonly diagnosticRepository: DiagnosticRepository,
    private readonly geminiService: GeminiService,
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
    const result = (await this.generateWithAi(data)) ?? this.buildDiagnostic(data.pymeData ?? {}, data.responses);
    return this.diagnosticRepository.create({
      pymeId: data.pymeId,
      responses: data.responses,
      result,
      score: result.puntajeGeneral,
      summary: result.resumenEjecutivo,
    });
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.diagnosticRepository.delete(id);
  }

  private buildDiagnostic(pymeData: Record<string, unknown>, responses: Record<string, unknown>): DiagnosticResult {
    const revenue = this.toNumber(responses.revenue);
    const techLevel = this.toNumber(responses.techLevel);
    const employees = this.toNumber(responses.employees ?? pymeData.employees);
    const years = this.toNumber(responses.years ?? pymeData.years);
    const challenges = String(responses.challenges ?? '').toLowerCase();

    const financeScore = revenue > 1000000 ? 82 : revenue > 300000 ? 68 : 52;
    const operationsScore = Math.min(95, Math.max(35, techLevel * 9 + 20));
    const teamScore = employees > 20 ? 74 : employees > 5 ? 64 : 52;
    const marketScore = years > 5 ? 76 : years > 2 ? 64 : 55;
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

  private generateWithAi(data: DiagnosticGenerateDto): Promise<DiagnosticResult | null> {
    return this.geminiService.generateJson<DiagnosticResult>(`
      Eres un consultor empresarial senior especializado en PYMES latinoamericanas.
      Analiza los datos y respuestas de la PYME. Responde solo JSON valido con camelCase:
      {
        "resumenEjecutivo": "string",
        "puntajeGeneral": number,
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
      DATOS_EMPRESA=${JSON.stringify(data.pymeData ?? {})}
      RESPUESTAS=${JSON.stringify(data.responses)}
    `);
  }

  private area(area: string, puntaje: number, hallazgo: string) {
    return {
      area,
      puntaje,
      estado: puntaje >= 80 ? 'fortaleza' : puntaje >= 65 ? 'aceptable' : puntaje >= 50 ? 'mejorable' : 'critico',
      hallazgo,
    };
  }

  private toNumber(value: unknown): number {
    const parsed = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
