import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { diagnostic, DiagnosticDTO } from '@db/tables/diagnostic.table';
import { User } from '@db/tables/user.table';

export async function seedDiagnostics(seededUsers: { byEmail: Record<string, User> }) {
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

  const diagnosticValues: DiagnosticDTO[] = [
    {
      pymeId: getUser('pyme@hubsme.com').id,
      responses: {
        sector: 'Manufactura',
        employees: 24,
        years: 7,
        revenue: '4200000',
        challenges: 'Desorden comercial y poca visibilidad de margen por linea.',
        techLevel: 5,
        marketShare: 'Media',
      },
      result: {
        resumenEjecutivo:
          'Textiles del Sur muestra buen nivel comercial, pero necesita disciplina operativa y mayor digitalizacion del pipeline.',
        puntajeGeneral: 85,
        areasEvaluadas: [
          {
            area: 'Comercial',
            puntaje: 82,
            estado: 'mejorable',
            hallazgo: 'Buen volumen de leads, bajo seguimiento consistente.',
          },
          {
            area: 'Finanzas',
            puntaje: 78,
            estado: 'mejorable',
            hallazgo: 'Margen por linea no se monitorea semanalmente.',
          },
          {
            area: 'Operaciones',
            puntaje: 88,
            estado: 'aceptable',
            hallazgo: 'Capacidad instalada adecuada con oportunidad de automatizacion.',
          },
          { area: 'Equipo', puntaje: 90, estado: 'fortaleza', hallazgo: 'Equipo estable y buena adopcion de cambios.' },
        ],
        problemasCriticos: [
          {
            problema: 'Seguimiento comercial inconsistente',
            impacto: 'Oportunidades se enfrian sin trazabilidad.',
            urgencia: 'alta',
          },
          {
            problema: 'Falta de score comercial semanal',
            impacto: 'Dificulta pronosticar ventas y performance.',
            urgencia: 'media',
          },
        ],
        recomendaciones: [
          {
            accion: 'Implementar CRM comercial',
            beneficioEsperado: 'Mayor tasa de seguimiento y cierre.',
            plazo: '30dias',
            prioridad: 'alta',
          },
          {
            accion: 'Crear tablero de margen por linea',
            beneficioEsperado: 'Mejor decision comercial y de pricing.',
            plazo: '90dias',
            prioridad: 'media',
          },
        ],
        proximosPasos: ['Designar owner del CRM', 'Definir ritual comercial semanal'],
      },
      score: 85,
      summary: 'Empresa con buena base, pero con brechas de seguimiento y visibilidad comercial.',
    },
    {
      pymeId: getUser('pyme@hubsme.com').id,
      responses: {
        sector: 'Manufactura',
        employees: 24,
        years: 7,
        revenue: '4400000',
        challenges: 'Escalar ventas manteniendo rentabilidad.',
        techLevel: 6,
      },
      result: {
        resumenEjecutivo:
          'La empresa mejoro en proceso comercial, aunque aun necesita una mejor capa analitica para sostener el crecimiento.',
        puntajeGeneral: 88,
        areasEvaluadas: [
          { area: 'Comercial', puntaje: 88, estado: 'aceptable', hallazgo: 'Mayor orden y uso semanal de pipeline.' },
          {
            area: 'Finanzas',
            puntaje: 81,
            estado: 'mejorable',
            hallazgo: 'Se requiere presupuesto rolling trimestral.',
          },
          {
            area: 'Operaciones',
            puntaje: 89,
            estado: 'fortaleza',
            hallazgo: 'Procesos mas estables y mejor abastecimiento.',
          },
          { area: 'Equipo', puntaje: 92, estado: 'fortaleza', hallazgo: 'Mayor accountability del equipo comercial.' },
        ],
        problemasCriticos: [
          {
            problema: 'Planeamiento financiero reactivo',
            impacto: 'Complica priorizar inversiones.',
            urgencia: 'media',
          },
        ],
        recomendaciones: [
          {
            accion: 'Implementar rolling forecast',
            beneficioEsperado: 'Mayor control del crecimiento.',
            plazo: '30dias',
            prioridad: 'alta',
          },
          {
            accion: 'Segmentar cartera de clientes',
            beneficioEsperado: 'Mejor foco comercial.',
            plazo: '90dias',
            prioridad: 'media',
          },
        ],
        proximosPasos: ['Definir forecast trimestral', 'Separar cartera A/B/C'],
      },
      score: 88,
      summary: 'Mayor madurez comercial con oportunidad en planeamiento financiero.',
    },
    {
      pymeId: getUser('contacto@tecnologistica.pe').id,
      responses: {
        sector: 'Logistica',
        employees: 38,
        years: 11,
        techLevel: 6,
        challenges: 'Costo por ruta y puntualidad',
      },
      result: {
        resumenEjecutivo: 'TecnoLogistica tiene una operacion con escala, pero poca disciplina de analitica por ruta.',
        puntajeGeneral: 79,
        areasEvaluadas: [
          { area: 'Operaciones', puntaje: 76, estado: 'mejorable', hallazgo: 'Falta scorecard por ruta y sede.' },
          {
            area: 'Finanzas',
            puntaje: 74,
            estado: 'mejorable',
            hallazgo: 'El costo unitario no se revisa por unidad operativa.',
          },
          {
            area: 'Equipo',
            puntaje: 84,
            estado: 'aceptable',
            hallazgo: 'Hay mandos fuertes, pero poca estandarizacion.',
          },
        ],
        problemasCriticos: [
          { problema: 'Desvios no categorizados', impacto: 'No se corrigen causas raiz.', urgencia: 'alta' },
        ],
        recomendaciones: [
          {
            accion: 'Implementar scorecard operacional',
            beneficioEsperado: 'Mayor visibilidad por ruta.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Medir OTIF por ruta', 'Clasificar causas de desvios'],
      },
      score: 79,
      summary: 'Operacion escalada con gran oportunidad analitica.',
    },
    {
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      responses: { sector: 'Alimentos', employees: 52, years: 14, techLevel: 5, challenges: 'Rentabilidad por canal' },
      result: {
        resumenEjecutivo: 'La empresa vende bien, pero no visualiza suficiente rentabilidad por cliente y canal.',
        puntajeGeneral: 81,
        areasEvaluadas: [
          { area: 'Finanzas', puntaje: 78, estado: 'mejorable', hallazgo: 'Subsidios cruzados entre canales.' },
          {
            area: 'Comercial',
            puntaje: 84,
            estado: 'aceptable',
            hallazgo: 'Buen despliegue comercial con poca disciplina de descuentos.',
          },
          {
            area: 'Operaciones',
            puntaje: 82,
            estado: 'aceptable',
            hallazgo: 'Cadena estable con poco forecast integrado.',
          },
        ],
        problemasCriticos: [
          { problema: 'Descuentos erosivos', impacto: 'Margen insuficiente en algunos clientes.', urgencia: 'alta' },
        ],
        recomendaciones: [
          {
            accion: 'Estado de resultados por canal',
            beneficioEsperado: 'Decisiones comerciales mas rentables.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Congelar descuentos no rentables', 'Separar margen por canal'],
      },
      score: 81,
      summary: 'Negocio sano con oportunidad fuerte en control de rentabilidad.',
    },
    {
      pymeId: getUser('operaciones@constructoranova.pe').id,
      responses: {
        sector: 'Construccion',
        employees: 31,
        years: 9,
        techLevel: 4,
        challenges: 'Desviaciones de obra y compras urgentes',
      },
      result: {
        resumenEjecutivo: 'Constructora Nova requiere mas disciplina operativa y tableros simples por obra.',
        puntajeGeneral: 77,
        areasEvaluadas: [
          {
            area: 'Operaciones',
            puntaje: 73,
            estado: 'mejorable',
            hallazgo: 'Seguimiento manual y disperso por proyecto.',
          },
          { area: 'Finanzas', puntaje: 79, estado: 'mejorable', hallazgo: 'Desvios de costos sin revision quincenal.' },
          {
            area: 'Equipo',
            puntaje: 80,
            estado: 'aceptable',
            hallazgo: 'Mandos con criterio, pero poca estandarizacion.',
          },
        ],
        problemasCriticos: [
          {
            problema: 'Compras urgentes frecuentes',
            impacto: 'Desordenan cronograma y presupuesto.',
            urgencia: 'alta',
          },
        ],
        recomendaciones: [
          {
            accion: 'Tablero por obra quincenal',
            beneficioEsperado: 'Mayor control de riesgos y costos.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Disenar tablero de obra', 'Estandarizar compras urgentes'],
      },
      score: 77,
      summary: 'Se necesita orden operativo mas que complejidad adicional.',
    },
    {
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      responses: { sector: 'Agroindustria', employees: 46, years: 6, techLevel: 6, challenges: 'Escala comercial B2B' },
      result: {
        resumenEjecutivo: 'BioAndes tiene potencial comercial alto, aunque su estructura de pipeline aun es inmadura.',
        puntajeGeneral: 83,
        areasEvaluadas: [
          {
            area: 'Comercial',
            puntaje: 79,
            estado: 'mejorable',
            hallazgo: 'Pipeline poco estructurado para cuentas grandes.',
          },
          { area: 'Operaciones', puntaje: 86, estado: 'aceptable', hallazgo: 'Buen cumplimiento productivo.' },
          { area: 'Equipo', puntaje: 87, estado: 'fortaleza', hallazgo: 'Equipo flexible y con buena apertura.' },
        ],
        problemasCriticos: [
          {
            problema: 'Prospeccion no sistematizada',
            impacto: 'Baja recurrencia de nuevas conversaciones.',
            urgencia: 'media',
          },
        ],
        recomendaciones: [
          {
            accion: 'Disenar pipeline de exportacion',
            beneficioEsperado: 'Mayor visibilidad y avance comercial.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Configurar pipeline B2B', 'Definir secuencia outbound'],
      },
      score: 83,
      summary: 'Negocio con potencial de expansion y necesidad de mayor sistema comercial.',
    },
    {
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      responses: {
        sector: 'Salud',
        employees: 19,
        years: 5,
        techLevel: 5,
        challenges: 'Conversion de leads y no shows',
      },
      result: {
        resumenEjecutivo: 'Clinica Dental Origen necesita mejorar respuesta comercial y experiencia omnicanal.',
        puntajeGeneral: 80,
        areasEvaluadas: [
          {
            area: 'Experiencia de cliente',
            puntaje: 76,
            estado: 'mejorable',
            hallazgo: 'Respuesta irregular entre sedes.',
          },
          {
            area: 'Comercial',
            puntaje: 81,
            estado: 'aceptable',
            hallazgo: 'Hay demanda, pero bajo seguimiento sistematico.',
          },
          { area: 'Equipo', puntaje: 82, estado: 'aceptable', hallazgo: 'Necesitan entrenamiento homogeneo.' },
        ],
        problemasCriticos: [
          { problema: 'No shows altos', impacto: 'Menor productividad de agenda.', urgencia: 'alta' },
        ],
        recomendaciones: [
          {
            accion: 'Unificar script de primera llamada',
            beneficioEsperado: 'Mejor conversion y experiencia.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Medir no shows por sede', 'Estandarizar respuesta comercial'],
      },
      score: 80,
      summary: 'La mejora comercial pasa por consistencia operacional y entrenamiento.',
    },
    {
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      responses: {
        sector: 'Retail digital',
        employees: 27,
        years: 4,
        techLevel: 7,
        challenges: 'Automatizar growth y reportes',
      },
      result: {
        resumenEjecutivo:
          'EcoSmart Commerce tiene traccion digital, pero aun desperdicia valor por falta de automatizacion y CRO.',
        puntajeGeneral: 84,
        areasEvaluadas: [
          {
            area: 'Marketing',
            puntaje: 82,
            estado: 'aceptable',
            hallazgo: 'Buen volumen de trafico, baja automatizacion post-compra.',
          },
          { area: 'Analitica', puntaje: 78, estado: 'mejorable', hallazgo: 'Reportes dispersos entre canales.' },
          {
            area: 'Operaciones',
            puntaje: 87,
            estado: 'fortaleza',
            hallazgo: 'Fulfillment estable y orientado a eficiencia.',
          },
        ],
        problemasCriticos: [
          {
            problema: 'Poca automatizacion de retencion',
            impacto: 'Menor LTV y conversion repetida.',
            urgencia: 'media',
          },
        ],
        recomendaciones: [
          {
            accion: 'Activar flujos de recuperacion y post-compra',
            beneficioEsperado: 'Mayor conversion y recompra.',
            plazo: '30dias',
            prioridad: 'alta',
          },
        ],
        proximosPasos: ['Priorizar roadmap CRO', 'Centralizar reportes ejecutivos'],
      },
      score: 84,
      summary: 'Buen negocio digital con oportunidad clara en analitica y automatizaciones.',
    },
  ];

  const existingDiagnostics = await database
    .select({ summary: diagnostic.summary })
    .from(diagnostic)
    .where(
      and(
        inArray(
          diagnostic.summary,
          diagnosticValues.map((item) => item.summary),
        ),
        isNull(diagnostic.deletedAt),
      ),
    );
  const existingDiagnosticSummaries = new Set(existingDiagnostics.map((item) => item.summary));

  if (diagnosticValues.some((item) => !existingDiagnosticSummaries.has(item.summary))) {
    await database
      .insert(diagnostic)
      .values(diagnosticValues.filter((item) => !existingDiagnosticSummaries.has(item.summary)));
  }
}
