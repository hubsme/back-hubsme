import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { meeting, MeetingMinutes } from '@db/tables/meeting.table';
import { User } from '@db/tables/user.table';
import { daysFromNow } from './utils.seed';

function buildMinutes(
  title: string,
  summary: string,
  agreements: { descripcion: string; responsable: string; fechaLimite?: string }[],
  tareasGeneradas: {
    titulo: string;
    descripcion: string;
    asignadoA: 'pyme' | 'consultor';
    prioridad: 'alta' | 'media' | 'baja';
  }[],
): MeetingMinutes {
  return {
    titulo: title,
    resumen: summary,
    puntosTratados: [
      'Revision de indicadores clave del negocio.',
      'Identificacion de cuellos de botella operativos.',
      'Priorizacion de acciones para las siguientes cuatro semanas.',
    ],
    acuerdos: agreements,
    tareasGeneradas,
  };
}

export async function seedMeetings(seededUsers: { byEmail: Record<string, User> }) {
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

  const meetingsToInsert = [
    {
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Diagnostico inicial de Textiles del Sur',
      startTime: daysFromNow(-28, 9),
      durationMinutes: 75,
      meetingUrl: 'https://meet.google.com/hub-textiles-001',
      status: 'finalizada' as const,
      description: 'Se revisaron ventas, abastecimiento, indicadores y brechas digitales.',
      minutes: buildMinutes(
        'Acta: Diagnostico inicial Textiles del Sur',
        'La empresa necesita ordenar pipeline comercial, digitalizar inventarios y profesionalizar seguimiento de oportunidades.',
        [
          {
            descripcion: 'Definir tablero comercial semanal.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-21).toISOString(),
          },
          {
            descripcion: 'Entregar propuesta de automatizacion CRM.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-20).toISOString(),
          },
        ],
        [
          {
            titulo: 'Crear tablero comercial compartido',
            descripcion: 'Centralizar leads, oportunidades y cierres por vendedor.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
          {
            titulo: 'Propuesta de stack digital',
            descripcion: 'Definir CRM, automatizaciones y flujo de reporte comercial.',
            asignadoA: 'consultor',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-28, 10, 30),
    },
    {
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Seguimiento de pipeline comercial',
      startTime: daysFromNow(-14, 15),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-textiles-002',
      status: 'finalizada' as const,
      description: 'Se validaron avances del CRM y el nuevo esquema de reuniones comerciales.',
      minutes: buildMinutes(
        'Acta: Seguimiento comercial Textiles',
        'El equipo ya trabaja con pipeline semanal, pero falta disciplina de registro y definicion de SLA comercial.',
        [
          {
            descripcion: 'Implementar SLA de respuesta de leads.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-9).toISOString(),
          },
          {
            descripcion: 'Capacitar a jefatura comercial en forecast.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-8).toISOString(),
          },
        ],
        [
          {
            titulo: 'Definir SLA de leads',
            descripcion: 'Establecer tiempos maximos de contacto para nuevos leads.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
          {
            titulo: 'Workshop de forecast',
            descripcion: 'Capacitar al equipo comercial en pronostico y seguimiento.',
            asignadoA: 'consultor',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-14, 16, 15),
    },
    {
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Revision de indicadores de abril',
      startTime: daysFromNow(3, 11),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-textiles-003',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Orden financiero trimestral',
      startTime: daysFromNow(8, 16),
      durationMinutes: 75,
      meetingUrl: 'https://meet.google.com/hub-textiles-004',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Optimizacion de rutas y costos',
      startTime: daysFromNow(-21, 10),
      durationMinutes: 90,
      meetingUrl: 'https://meet.google.com/hub-log-001',
      status: 'finalizada' as const,
      description: 'Se revisaron costos por ruta, KPI de cumplimiento y variacion por conductor.',
      minutes: buildMinutes(
        'Acta: Rutas y costos TecnoLogistica',
        'Se detecto dispersion en tiempos de entrega y baja trazabilidad sobre los desvios de kilometraje.',
        [
          {
            descripcion: 'Disenar scorecard por ruta.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-16).toISOString(),
          },
          {
            descripcion: 'Etiquetar desvios recurrentes en GPS.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-15).toISOString(),
          },
        ],
        [
          {
            titulo: 'Scorecard por ruta',
            descripcion: 'Crear reporte semanal de costo, puntualidad y desvios por ruta.',
            asignadoA: 'consultor',
            prioridad: 'alta',
          },
          {
            titulo: 'Clasificar desvios',
            descripcion: 'Etiquetar causas raiz de desvios y documentarlas en operaciones.',
            asignadoA: 'pyme',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-21, 12),
    },
    {
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Tablero de operaciones semanal',
      startTime: daysFromNow(5, 9),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-log-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Cierre de hallazgos operativos',
      startTime: daysFromNow(13, 17),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-log-003',
      status: 'solicitada' as const,
    },
    {
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Rentabilidad por canal',
      startTime: daysFromNow(-18, 14),
      durationMinutes: 80,
      meetingUrl: 'https://meet.google.com/hub-food-001',
      status: 'finalizada' as const,
      description: 'Analisis de margen por canal moderno, distribuidores y horeca.',
      minutes: buildMinutes(
        'Acta: Rentabilidad por canal',
        'Se hallo subsidio cruzado entre canales y falta de criterio uniforme de descuentos comerciales.',
        [
          {
            descripcion: 'Construir estado de resultados por canal.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-12).toISOString(),
          },
          {
            descripcion: 'Congelar descuentos no rentables.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-11).toISOString(),
          },
        ],
        [
          {
            titulo: 'Estado de resultados por canal',
            descripcion: 'Separar ventas, costos y descuentos por canal comercial.',
            asignadoA: 'consultor',
            prioridad: 'alta',
          },
          {
            titulo: 'Revisar matriz de descuentos',
            descripcion: 'Reducir descuentos de clientes con margen insuficiente.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
        ],
      ),
      completedAt: daysFromNow(-18, 15, 30),
    },
    {
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Growth plan retail moderno',
      startTime: daysFromNow(4, 15),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-food-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('operaciones@constructoranova.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Control de costos de obra',
      startTime: daysFromNow(-26, 8),
      durationMinutes: 70,
      meetingUrl: 'https://meet.google.com/hub-con-001',
      status: 'finalizada' as const,
      description: 'Revision de desviaciones presupuestales, compras y productividad por frente.',
      minutes: buildMinutes(
        'Acta: Control de costos de obra',
        'Se detectaron retrasos por compras de emergencia y falta de tablero quincenal por obra.',
        [
          {
            descripcion: 'Estandarizar reporte quincenal de avance.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-20).toISOString(),
          },
          {
            descripcion: 'Definir formato de compras criticas.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-19).toISOString(),
          },
        ],
        [
          {
            titulo: 'Reporte quincenal por obra',
            descripcion: 'Levantar un tablero por obra con costos, avance y riesgos.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
          {
            titulo: 'Formato de compras criticas',
            descripcion: 'Definir flujo de aprobacion y seguimiento para compras urgentes.',
            asignadoA: 'consultor',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-26, 9, 40),
    },
    {
      pymeId: getUser('operaciones@constructoranova.pe').id,
      consultantId: getUser('elena.rivas@hubsme.com').id,
      title: 'Estructura de mandos medios',
      startTime: daysFromNow(6, 12),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-con-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Expansion comercial B2B',
      startTime: daysFromNow(-11, 11),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-bio-001',
      status: 'finalizada' as const,
      description: 'Se revisaron cuentas target, pipeline de exportacion y estructura de seguimiento comercial.',
      minutes: buildMinutes(
        'Acta: Expansion comercial B2B',
        'El negocio tiene buen producto pero pipeline inmaduro y baja frecuencia de seguimiento con prospectos clave.',
        [
          {
            descripcion: 'Crear pipeline B2B en CRM.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-6).toISOString(),
          },
          {
            descripcion: 'Definir secuencia de prospeccion outbound.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-5).toISOString(),
          },
        ],
        [
          {
            titulo: 'Pipeline B2B',
            descripcion: 'Configurar fases y responsables para las cuentas de exportacion.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
          {
            titulo: 'Secuencia outbound',
            descripcion: 'Armar secuencia de emails y mensajes para prospectos internacionales.',
            asignadoA: 'consultor',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-11, 12, 10),
    },
    {
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Modelo de demanda y stock',
      startTime: daysFromNow(10, 10),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-bio-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      consultantId: getUser('valeria.soto@hubsme.com').id,
      title: 'Experiencia de paciente omnicanal',
      startTime: daysFromNow(-9, 17),
      durationMinutes: 65,
      meetingUrl: 'https://meet.google.com/hub-dental-001',
      status: 'finalizada' as const,
      description: 'Mapeo del journey, conversion de leads y tiempos de respuesta en sedes.',
      minutes: buildMinutes(
        'Acta: Experiencia de paciente',
        'El principal reto esta en la respuesta a leads y consistencia entre agenda, confirmacion y llegada a cita.',
        [
          {
            descripcion: 'Definir script de contacto y seguimiento.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-4).toISOString(),
          },
          { descripcion: 'Medir no shows por sede.', responsable: 'PYME', fechaLimite: daysFromNow(-3).toISOString() },
        ],
        [
          {
            titulo: 'Script comercial de primera llamada',
            descripcion: 'Unificar preguntas, beneficios y cierre de primera llamada.',
            asignadoA: 'consultor',
            prioridad: 'alta',
          },
          {
            titulo: 'Tablero de no shows',
            descripcion: 'Registrar inasistencias por sede y causa declarada.',
            asignadoA: 'pyme',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-9, 18, 20),
    },
    {
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      consultantId: getUser('elena.rivas@hubsme.com').id,
      title: 'Capacitacion de coordinadoras',
      startTime: daysFromNow(7, 9),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-dental-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Ecommerce growth sprint',
      startTime: daysFromNow(-7, 16),
      durationMinutes: 70,
      meetingUrl: 'https://meet.google.com/hub-eco-001',
      status: 'finalizada' as const,
      description: 'Revision de conversion del sitio, email marketing y performance paid.',
      minutes: buildMinutes(
        'Acta: Growth sprint ecommerce',
        'La tienda necesita mejor segmentacion de audiencias y automatizaciones post-compra.',
        [
          {
            descripcion: 'Configurar flujos de carrito abandonado.',
            responsable: 'PYME',
            fechaLimite: daysFromNow(-2).toISOString(),
          },
          {
            descripcion: 'Definir roadmap de CRO.',
            responsable: 'CONSULTOR',
            fechaLimite: daysFromNow(-1).toISOString(),
          },
        ],
        [
          {
            titulo: 'Flujos de carrito abandonado',
            descripcion: 'Activar secuencia de recuperacion en email y WhatsApp.',
            asignadoA: 'pyme',
            prioridad: 'alta',
          },
          {
            titulo: 'Roadmap CRO',
            descripcion: 'Priorizar hipotesis de conversion para home, PDP y checkout.',
            asignadoA: 'consultor',
            prioridad: 'media',
          },
        ],
      ),
      completedAt: daysFromNow(-7, 17, 40),
    },
    {
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Automatizacion de reportes',
      startTime: daysFromNow(12, 11),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-eco-002',
      status: 'confirmada' as const,
    },
    {
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Mesa de seguimiento de rentabilidad',
      startTime: daysFromNow(15, 14),
      durationMinutes: 60,
      meetingUrl: 'https://meet.google.com/hub-food-003',
      status: 'confirmada' as const,
    },
  ];

  const existingMeetings = await database
    .select({ title: meeting.title })
    .from(meeting)
    .where(
      and(
        inArray(
          meeting.title,
          meetingsToInsert.map((item) => item.title),
        ),
        isNull(meeting.deletedAt),
      ),
    );
  const existingMeetingTitles = new Set(existingMeetings.map((item) => item.title));

  if (meetingsToInsert.some((item) => !existingMeetingTitles.has(item.title))) {
    await database.insert(meeting).values(meetingsToInsert.filter((item) => !existingMeetingTitles.has(item.title)));
  }

  const insertedMeetings = await database
    .select()
    .from(meeting)
    .where(
      and(
        inArray(
          meeting.title,
          meetingsToInsert.map((item) => item.title),
        ),
        isNull(meeting.deletedAt),
      ),
    );

  return insertedMeetings.reduce<Record<string, (typeof insertedMeetings)[number]>>((acc, current) => {
    acc[current.title] = current;
    return acc;
  }, {});
}
