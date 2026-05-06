import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant, ConsultantDTO } from '@db/tables/consultant.table';
import { diagnostic, DiagnosticDTO } from '@db/tables/diagnostic.table';
import { meeting, MeetingMinutes } from '@db/tables/meeting.table';
import { pyme, PymeDTO } from '@db/tables/pyme.table';
import { subscription, SubscriptionDTO } from '@db/tables/subscription.table';
import { task, TaskDTO } from '@db/tables/task.table';
import { seedUsers } from '@seeds/user.seed';

function daysFromNow(days: number, hour = 10, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function buildMinutes(
  title: string,
  summary: string,
  agreements: { descripcion: string; responsable: string; fechaLimite?: string }[],
  tareasGeneradas: { titulo: string; descripcion: string; asignadoA: 'pyme' | 'consultor'; prioridad: 'alta' | 'media' | 'baja' }[],
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

export async function seedHubsmeData() {
  const seededUsers = await seedUsers();
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

  const pymeValues: PymeDTO[] = [
      {
        userId: getUser('pyme@hubsme.com').id,
        name: 'Textiles del Sur SAC',
        ruc: '20600000001',
        sector: 'Manufactura',
        numEmployees: 24,
        yearsInOperation: 7,
        description: 'PYME textil peruana en proceso de digitalizacion comercial y mejora de abastecimiento.',
      },
      {
        userId: getUser('contacto@tecnologistica.pe').id,
        name: 'TecnoLogistica Express',
        ruc: '20600000002',
        sector: 'Logistica',
        numEmployees: 38,
        yearsInOperation: 11,
        description: 'Operador logistico con foco en despacho urbano, trazabilidad y optimizacion de rutas.',
      },
      {
        userId: getUser('gerencia@alimentospacifico.pe').id,
        name: 'Alimentos Pacifico',
        ruc: '20600000003',
        sector: 'Alimentos',
        numEmployees: 52,
        yearsInOperation: 14,
        description: 'Productora y distribuidora de snacks saludables para retail y canal horeca.',
      },
      {
        userId: getUser('operaciones@constructoranova.pe').id,
        name: 'Constructora Nova',
        ruc: '20600000004',
        sector: 'Construccion',
        numEmployees: 31,
        yearsInOperation: 9,
        description: 'Constructora mediana con retos en planificacion de obra, costos y compras.',
      },
      {
        userId: getUser('equipo@bioandesfoods.pe').id,
        name: 'BioAndes Foods',
        ruc: '20600000005',
        sector: 'Agroindustria',
        numEmployees: 46,
        yearsInOperation: 6,
        description: 'Exportadora de superfoods con necesidad de mejorar forecasting y relacion comercial.',
      },
      {
        userId: getUser('direccion@clinicadentalorigen.pe').id,
        name: 'Clinica Dental Origen',
        ruc: '20600000006',
        sector: 'Salud',
        numEmployees: 19,
        yearsInOperation: 5,
        description: 'Clinica odontologica con varias sedes y reto en experiencia de paciente y conversion comercial.',
      },
      {
        userId: getUser('admin@ecosmartcommerce.pe').id,
        name: 'EcoSmart Commerce',
        ruc: '20600000007',
        sector: 'Retail digital',
        numEmployees: 27,
        yearsInOperation: 4,
        description: 'Ecommerce en crecimiento enfocado en productos sostenibles y automatizacion de marketing.',
      },
    ];

  const existingPymes = await database
    .select()
    .from(pyme)
    .where(and(inArray(pyme.userId, pymeValues.map((item) => item.userId)), isNull(pyme.deletedAt)));
  const existingPymeUserIds = new Set(existingPymes.map((item) => item.userId));

  if (pymeValues.some((item) => !existingPymeUserIds.has(item.userId))) {
    await database
      .insert(pyme)
      .values(pymeValues.filter((item) => !existingPymeUserIds.has(item.userId)));
  }

  const pymeRows = await database
    .select()
    .from(pyme)
    .where(and(inArray(pyme.userId, pymeValues.map((item) => item.userId)), isNull(pyme.deletedAt)));

  const consultantValues: ConsultantDTO[] = [
      {
        userId: getUser('consultor@hubsme.com').id,
        name: 'Carlos Mendoza',
        bio: 'Consultor en transformacion digital, procesos y crecimiento para PYMES.',
        specialties: ['Tecnologia', 'Operaciones', 'Estrategia'],
        sectors: ['Retail', 'Manufactura', 'Logistica'],
        pricePerHour: '150.00',
        rating: '4.90',
        totalReviews: 42,
        active: 'true',
        validated: 'true',
      },
      {
        userId: getUser('ana.torres@hubsme.com').id,
        name: 'Ana Lucia Torres',
        bio: 'Especialista en finanzas, control de gestion y estructuras de rentabilidad para empresas en expansion.',
        specialties: ['Finanzas', 'Planeamiento', 'Control de gestion'],
        sectors: ['Servicios', 'Salud', 'Alimentos'],
        pricePerHour: '180.00',
        rating: '4.80',
        totalReviews: 31,
        active: 'true',
        validated: 'true',
      },
      {
        userId: getUser('roberto.sanchez@hubsme.com').id,
        name: 'Roberto Sanchez',
        bio: 'Experto en operaciones, supply chain y productividad para negocios con multiples frentes operativos.',
        specialties: ['Operaciones', 'Supply chain', 'Productividad'],
        sectors: ['Manufactura', 'Construccion', 'Logistica'],
        pricePerHour: '165.00',
        rating: '4.70',
        totalReviews: 28,
        active: 'true',
        validated: 'true',
      },
      {
        userId: getUser('elena.rivas@hubsme.com').id,
        name: 'Elena Rivas',
        bio: 'Consultora en recursos humanos, cultura organizacional y desarrollo de liderazgo.',
        specialties: ['RRHH', 'Cultura', 'Liderazgo'],
        sectors: ['Servicios', 'Salud', 'Retail digital'],
        pricePerHour: '135.00',
        rating: '4.90',
        totalReviews: 24,
        active: 'true',
        validated: 'true',
      },
      {
        userId: getUser('marco.paredes@hubsme.com').id,
        name: 'Marco Paredes',
        bio: 'Asesor comercial y growth partner para equipos B2B y ecommerce omnicanal.',
        specialties: ['Ventas', 'Growth', 'Marketing'],
        sectors: ['Retail digital', 'Servicios', 'Agroindustria'],
        pricePerHour: '145.00',
        rating: '4.60',
        totalReviews: 19,
        active: 'true',
        validated: 'true',
      },
      {
        userId: getUser('valeria.soto@hubsme.com').id,
        name: 'Valeria Soto',
        bio: 'Consultora de experiencia de cliente y diseno de servicio para negocios de salud y atencion.',
        specialties: ['CX', 'Procesos de atencion', 'Growth'],
        sectors: ['Salud', 'Servicios', 'Retail'],
        pricePerHour: '140.00',
        rating: '4.85',
        totalReviews: 17,
        active: 'true',
        validated: 'true',
      },
    ];

  const existingConsultants = await database
    .select()
    .from(consultant)
    .where(and(inArray(consultant.userId, consultantValues.map((item) => item.userId)), isNull(consultant.deletedAt)));
  const existingConsultantUserIds = new Set(existingConsultants.map((item) => item.userId));

  if (consultantValues.some((item) => !existingConsultantUserIds.has(item.userId))) {
    await database
      .insert(consultant)
      .values(consultantValues.filter((item) => !existingConsultantUserIds.has(item.userId)));
  }

  const consultantRows = await database
    .select()
    .from(consultant)
    .where(and(inArray(consultant.userId, consultantValues.map((item) => item.userId)), isNull(consultant.deletedAt)));

  const pymeByName = pymeRows.reduce<Record<string, (typeof pymeRows)[number]>>((acc, current) => {
    acc[current.name] = current;
    return acc;
  }, {});
  const consultantByName = consultantRows.reduce<Record<string, (typeof consultantRows)[number]>>((acc, current) => {
    acc[current.name] = current;
    return acc;
  }, {});

  const subscriptionValues: SubscriptionDTO[] = [
    {
      userId: getUser('consultor@hubsme.com').id,
      plan: 'pro',
      status: 'active',
      startedAt: daysFromNow(-120),
      expiresAt: daysFromNow(245),
    },
    {
      userId: getUser('ana.torres@hubsme.com').id,
      plan: 'expert',
      status: 'active',
      startedAt: daysFromNow(-200),
      expiresAt: daysFromNow(160),
    },
    {
      userId: getUser('roberto.sanchez@hubsme.com').id,
      plan: 'basic',
      status: 'active',
      startedAt: daysFromNow(-75),
      expiresAt: daysFromNow(290),
    },
    {
      userId: getUser('elena.rivas@hubsme.com').id,
      plan: 'pro',
      status: 'paused',
      startedAt: daysFromNow(-140),
      expiresAt: daysFromNow(80),
    },
    {
      userId: getUser('marco.paredes@hubsme.com').id,
      plan: 'free',
      status: 'active',
      startedAt: daysFromNow(-35),
    },
    {
      userId: getUser('valeria.soto@hubsme.com').id,
      plan: 'basic',
      status: 'active',
      startedAt: daysFromNow(-55),
      expiresAt: daysFromNow(310),
    },
  ];

  const existingSubscriptions = await database
    .select()
    .from(subscription)
    .where(and(inArray(subscription.userId, subscriptionValues.map((item) => item.userId)), isNull(subscription.deletedAt)));
  const existingSubscriptionUserIds = new Set(existingSubscriptions.map((item) => item.userId));

  if (subscriptionValues.some((item) => !existingSubscriptionUserIds.has(item.userId))) {
    await database
      .insert(subscription)
      .values(subscriptionValues.filter((item) => !existingSubscriptionUserIds.has(item.userId)));
  }

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
          { descripcion: 'Definir tablero comercial semanal.', responsable: 'PYME', fechaLimite: daysFromNow(-21).toISOString() },
          { descripcion: 'Entregar propuesta de automatizacion CRM.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-20).toISOString() },
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
          { descripcion: 'Implementar SLA de respuesta de leads.', responsable: 'PYME', fechaLimite: daysFromNow(-9).toISOString() },
          { descripcion: 'Capacitar a jefatura comercial en forecast.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-8).toISOString() },
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
          { descripcion: 'Disenar scorecard por ruta.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-16).toISOString() },
          { descripcion: 'Etiquetar desvios recurrentes en GPS.', responsable: 'PYME', fechaLimite: daysFromNow(-15).toISOString() },
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
          { descripcion: 'Construir estado de resultados por canal.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-12).toISOString() },
          { descripcion: 'Congelar descuentos no rentables.', responsable: 'PYME', fechaLimite: daysFromNow(-11).toISOString() },
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
          { descripcion: 'Estandarizar reporte quincenal de avance.', responsable: 'PYME', fechaLimite: daysFromNow(-20).toISOString() },
          { descripcion: 'Definir formato de compras criticas.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-19).toISOString() },
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
          { descripcion: 'Crear pipeline B2B en CRM.', responsable: 'PYME', fechaLimite: daysFromNow(-6).toISOString() },
          { descripcion: 'Definir secuencia de prospeccion outbound.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-5).toISOString() },
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
          { descripcion: 'Definir script de contacto y seguimiento.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-4).toISOString() },
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
          { descripcion: 'Configurar flujos de carrito abandonado.', responsable: 'PYME', fechaLimite: daysFromNow(-2).toISOString() },
          { descripcion: 'Definir roadmap de CRO.', responsable: 'CONSULTOR', fechaLimite: daysFromNow(-1).toISOString() },
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
    .where(and(inArray(meeting.title, meetingsToInsert.map((item) => item.title)), isNull(meeting.deletedAt)));
  const existingMeetingTitles = new Set(existingMeetings.map((item) => item.title));

  if (meetingsToInsert.some((item) => !existingMeetingTitles.has(item.title))) {
    await database
      .insert(meeting)
      .values(meetingsToInsert.filter((item) => !existingMeetingTitles.has(item.title)));
  }

  const insertedMeetings = await database
    .select()
    .from(meeting)
    .where(and(inArray(meeting.title, meetingsToInsert.map((item) => item.title)), isNull(meeting.deletedAt)));

  const meetingByTitle = insertedMeetings.reduce<Record<string, (typeof insertedMeetings)[number]>>((acc, current) => {
    acc[current.title] = current;
    return acc;
  }, {});

  const taskValues: TaskDTO[] = [
    {
      meetingId: meetingByTitle['Diagnostico inicial de Textiles del Sur'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Crear tablero comercial compartido',
      description: 'Centralizar leads, oportunidades y cierres por vendedor.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'completada',
      dueDate: daysFromNow(-18),
    },
    {
      meetingId: meetingByTitle['Diagnostico inicial de Textiles del Sur'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Propuesta de stack digital',
      description: 'Definir CRM, automatizaciones y flujo de reporte comercial.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'completada',
      dueDate: daysFromNow(-17),
    },
    {
      meetingId: meetingByTitle['Seguimiento de pipeline comercial'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Definir SLA de leads',
      description: 'Establecer tiempos maximos de contacto para nuevos leads.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'en_progreso',
      dueDate: daysFromNow(2),
    },
    {
      meetingId: meetingByTitle['Seguimiento de pipeline comercial'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Workshop de forecast',
      description: 'Capacitar al equipo comercial en pronostico y seguimiento.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(4),
    },
    {
      meetingId: meetingByTitle['Revision de indicadores de abril'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Actualizar score semanal de vendedores',
      description: 'Agregar conversion, ticket y tiempo de seguimiento al score comercial.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(6),
    },
    {
      meetingId: meetingByTitle['Orden financiero trimestral'].id,
      pymeId: getUser('pyme@hubsme.com').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Consolidar flujo de caja trimestral',
      description: 'Armar una vista de ingresos, egresos y necesidades de capital de trabajo.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'pendiente',
      dueDate: daysFromNow(10),
    },
    {
      meetingId: meetingByTitle['Optimizacion de rutas y costos'].id,
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Scorecard por ruta',
      description: 'Crear reporte semanal de costo, puntualidad y desvios por ruta.',
      assignedTo: 'consultor',
      priority: 'alta',
      status: 'completada',
      dueDate: daysFromNow(-13),
    },
    {
      meetingId: meetingByTitle['Optimizacion de rutas y costos'].id,
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Clasificar desvios',
      description: 'Etiquetar causas raiz de desvios y documentarlas en operaciones.',
      assignedTo: 'pyme',
      priority: 'media',
      status: 'en_progreso',
      dueDate: daysFromNow(1),
    },
    {
      meetingId: meetingByTitle['Tablero de operaciones semanal'].id,
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Levantar tablero semanal de puntualidad',
      description: 'Seguimiento por OTIF, costo y alertas de capacidad.',
      assignedTo: 'consultor',
      priority: 'alta',
      status: 'pendiente',
      dueDate: daysFromNow(8),
    },
    {
      meetingId: meetingByTitle['Cierre de hallazgos operativos'].id,
      pymeId: getUser('contacto@tecnologistica.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Normalizar tiempos de carga en sede norte',
      description: 'Reducir tiempos improductivos previos al despacho.',
      assignedTo: 'pyme',
      priority: 'media',
      status: 'bloqueada',
      dueDate: daysFromNow(16),
    },
    {
      meetingId: meetingByTitle['Rentabilidad por canal'].id,
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Estado de resultados por canal',
      description: 'Separar ventas, costos y descuentos por canal comercial.',
      assignedTo: 'consultor',
      priority: 'alta',
      status: 'completada',
      dueDate: daysFromNow(-10),
    },
    {
      meetingId: meetingByTitle['Rentabilidad por canal'].id,
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Revisar matriz de descuentos',
      description: 'Reducir descuentos de clientes con margen insuficiente.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'en_progreso',
      dueDate: daysFromNow(3),
    },
    {
      meetingId: meetingByTitle['Growth plan retail moderno'].id,
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Definir promociones por canal moderno',
      description: 'Disenar calendario promocional con foco en rentabilidad.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(9),
    },
    {
      meetingId: meetingByTitle['Control de costos de obra'].id,
      pymeId: getUser('operaciones@constructoranova.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Reporte quincenal por obra',
      description: 'Levantar un tablero por obra con costos, avance y riesgos.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'completada',
      dueDate: daysFromNow(-17),
    },
    {
      meetingId: meetingByTitle['Control de costos de obra'].id,
      pymeId: getUser('operaciones@constructoranova.pe').id,
      consultantId: getUser('roberto.sanchez@hubsme.com').id,
      title: 'Formato de compras criticas',
      description: 'Definir flujo de aprobacion y seguimiento para compras urgentes.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(7),
    },
    {
      meetingId: meetingByTitle['Estructura de mandos medios'].id,
      pymeId: getUser('operaciones@constructoranova.pe').id,
      consultantId: getUser('elena.rivas@hubsme.com').id,
      title: 'Mapa de roles de jefatura',
      description: 'Clarificar alcance, responsabilidades y metricas de los mandos medios.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(11),
    },
    {
      meetingId: meetingByTitle['Expansion comercial B2B'].id,
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Pipeline B2B',
      description: 'Configurar fases y responsables para las cuentas de exportacion.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'en_progreso',
      dueDate: daysFromNow(2),
    },
    {
      meetingId: meetingByTitle['Expansion comercial B2B'].id,
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Secuencia outbound',
      description: 'Armar secuencia de emails y mensajes para prospectos internacionales.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(6),
    },
    {
      meetingId: meetingByTitle['Modelo de demanda y stock'].id,
      pymeId: getUser('equipo@bioandesfoods.pe').id,
      consultantId: getUser('ana.torres@hubsme.com').id,
      title: 'Actualizar forecast trimestral',
      description: 'Refinar demanda proyectada por SKU y mercado.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'bloqueada',
      dueDate: daysFromNow(14),
    },
    {
      meetingId: meetingByTitle['Experiencia de paciente omnicanal'].id,
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      consultantId: getUser('valeria.soto@hubsme.com').id,
      title: 'Script comercial de primera llamada',
      description: 'Unificar preguntas, beneficios y cierre de primera llamada.',
      assignedTo: 'consultor',
      priority: 'alta',
      status: 'completada',
      dueDate: daysFromNow(-2),
    },
    {
      meetingId: meetingByTitle['Experiencia de paciente omnicanal'].id,
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      consultantId: getUser('valeria.soto@hubsme.com').id,
      title: 'Tablero de no shows',
      description: 'Registrar inasistencias por sede y causa declarada.',
      assignedTo: 'pyme',
      priority: 'media',
      status: 'en_progreso',
      dueDate: daysFromNow(5),
    },
    {
      meetingId: meetingByTitle['Capacitacion de coordinadoras'].id,
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      consultantId: getUser('elena.rivas@hubsme.com').id,
      title: 'Plan de onboarding para coordinadoras',
      description: 'Definir contenidos, evaluaciones y ritmo de entrenamiento.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(9),
    },
    {
      meetingId: meetingByTitle['Ecommerce growth sprint'].id,
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Flujos de carrito abandonado',
      description: 'Activar secuencia de recuperacion en email y WhatsApp.',
      assignedTo: 'pyme',
      priority: 'alta',
      status: 'en_progreso',
      dueDate: daysFromNow(3),
    },
    {
      meetingId: meetingByTitle['Ecommerce growth sprint'].id,
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      consultantId: getUser('marco.paredes@hubsme.com').id,
      title: 'Roadmap CRO',
      description: 'Priorizar hipotesis de conversion para home, PDP y checkout.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(8),
    },
    {
      meetingId: meetingByTitle['Automatizacion de reportes'].id,
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Definir fuentes para dashboard ejecutivo',
      description: 'Mapear Shopify, Meta Ads y CRM hacia un tablero ejecutivo unico.',
      assignedTo: 'consultor',
      priority: 'alta',
      status: 'pendiente',
      dueDate: daysFromNow(13),
    },
    {
      meetingId: meetingByTitle['Mesa de seguimiento de rentabilidad'].id,
      pymeId: getUser('gerencia@alimentospacifico.pe').id,
      consultantId: getUser('consultor@hubsme.com').id,
      title: 'Armar minuta de rentabilidad mensual',
      description: 'Preparar formato recurrente de seguimiento comercial y financiero.',
      assignedTo: 'consultor',
      priority: 'media',
      status: 'pendiente',
      dueDate: daysFromNow(17),
    },
  ];

  const existingTasks = await database
    .select({ title: task.title })
    .from(task)
    .where(and(inArray(task.title, taskValues.map((item) => item.title)), isNull(task.deletedAt)));
  const existingTaskTitles = new Set(existingTasks.map((item) => item.title));

  if (taskValues.some((item) => !existingTaskTitles.has(item.title))) {
    await database.insert(task).values(taskValues.filter((item) => !existingTaskTitles.has(item.title)));
  }

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
          { area: 'Comercial', puntaje: 82, estado: 'mejorable', hallazgo: 'Buen volumen de leads, bajo seguimiento consistente.' },
          { area: 'Finanzas', puntaje: 78, estado: 'mejorable', hallazgo: 'Margen por linea no se monitorea semanalmente.' },
          { area: 'Operaciones', puntaje: 88, estado: 'aceptable', hallazgo: 'Capacidad instalada adecuada con oportunidad de automatizacion.' },
          { area: 'Equipo', puntaje: 90, estado: 'fortaleza', hallazgo: 'Equipo estable y buena adopcion de cambios.' },
        ],
        problemasCriticos: [
          { problema: 'Seguimiento comercial inconsistente', impacto: 'Oportunidades se enfrian sin trazabilidad.', urgencia: 'alta' },
          { problema: 'Falta de score comercial semanal', impacto: 'Dificulta pronosticar ventas y performance.', urgencia: 'media' },
        ],
        recomendaciones: [
          { accion: 'Implementar CRM comercial', beneficioEsperado: 'Mayor tasa de seguimiento y cierre.', plazo: '30dias', prioridad: 'alta' },
          { accion: 'Crear tablero de margen por linea', beneficioEsperado: 'Mejor decision comercial y de pricing.', plazo: '90dias', prioridad: 'media' },
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
          { area: 'Finanzas', puntaje: 81, estado: 'mejorable', hallazgo: 'Se requiere presupuesto rolling trimestral.' },
          { area: 'Operaciones', puntaje: 89, estado: 'fortaleza', hallazgo: 'Procesos mas estables y mejor abastecimiento.' },
          { area: 'Equipo', puntaje: 92, estado: 'fortaleza', hallazgo: 'Mayor accountability del equipo comercial.' },
        ],
        problemasCriticos: [{ problema: 'Planeamiento financiero reactivo', impacto: 'Complica priorizar inversiones.', urgencia: 'media' }],
        recomendaciones: [
          { accion: 'Implementar rolling forecast', beneficioEsperado: 'Mayor control del crecimiento.', plazo: '30dias', prioridad: 'alta' },
          { accion: 'Segmentar cartera de clientes', beneficioEsperado: 'Mejor foco comercial.', plazo: '90dias', prioridad: 'media' },
        ],
        proximosPasos: ['Definir forecast trimestral', 'Separar cartera A/B/C'],
      },
      score: 88,
      summary: 'Mayor madurez comercial con oportunidad en planeamiento financiero.',
    },
    {
      pymeId: getUser('contacto@tecnologistica.pe').id,
      responses: { sector: 'Logistica', employees: 38, years: 11, techLevel: 6, challenges: 'Costo por ruta y puntualidad' },
      result: {
        resumenEjecutivo: 'TecnoLogistica tiene una operacion con escala, pero poca disciplina de analitica por ruta.',
        puntajeGeneral: 79,
        areasEvaluadas: [
          { area: 'Operaciones', puntaje: 76, estado: 'mejorable', hallazgo: 'Falta scorecard por ruta y sede.' },
          { area: 'Finanzas', puntaje: 74, estado: 'mejorable', hallazgo: 'El costo unitario no se revisa por unidad operativa.' },
          { area: 'Equipo', puntaje: 84, estado: 'aceptable', hallazgo: 'Hay mandos fuertes, pero poca estandarizacion.' },
        ],
        problemasCriticos: [{ problema: 'Desvios no categorizados', impacto: 'No se corrigen causas raiz.', urgencia: 'alta' }],
        recomendaciones: [
          { accion: 'Implementar scorecard operacional', beneficioEsperado: 'Mayor visibilidad por ruta.', plazo: '30dias', prioridad: 'alta' },
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
          { area: 'Comercial', puntaje: 84, estado: 'aceptable', hallazgo: 'Buen despliegue comercial con poca disciplina de descuentos.' },
          { area: 'Operaciones', puntaje: 82, estado: 'aceptable', hallazgo: 'Cadena estable con poco forecast integrado.' },
        ],
        problemasCriticos: [{ problema: 'Descuentos erosivos', impacto: 'Margen insuficiente en algunos clientes.', urgencia: 'alta' }],
        recomendaciones: [
          { accion: 'Estado de resultados por canal', beneficioEsperado: 'Decisiones comerciales mas rentables.', plazo: '30dias', prioridad: 'alta' },
        ],
        proximosPasos: ['Congelar descuentos no rentables', 'Separar margen por canal'],
      },
      score: 81,
      summary: 'Negocio sano con oportunidad fuerte en control de rentabilidad.',
    },
    {
      pymeId: getUser('operaciones@constructoranova.pe').id,
      responses: { sector: 'Construccion', employees: 31, years: 9, techLevel: 4, challenges: 'Desviaciones de obra y compras urgentes' },
      result: {
        resumenEjecutivo: 'Constructora Nova requiere mas disciplina operativa y tableros simples por obra.',
        puntajeGeneral: 77,
        areasEvaluadas: [
          { area: 'Operaciones', puntaje: 73, estado: 'mejorable', hallazgo: 'Seguimiento manual y disperso por proyecto.' },
          { area: 'Finanzas', puntaje: 79, estado: 'mejorable', hallazgo: 'Desvios de costos sin revision quincenal.' },
          { area: 'Equipo', puntaje: 80, estado: 'aceptable', hallazgo: 'Mandos con criterio, pero poca estandarizacion.' },
        ],
        problemasCriticos: [{ problema: 'Compras urgentes frecuentes', impacto: 'Desordenan cronograma y presupuesto.', urgencia: 'alta' }],
        recomendaciones: [
          { accion: 'Tablero por obra quincenal', beneficioEsperado: 'Mayor control de riesgos y costos.', plazo: '30dias', prioridad: 'alta' },
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
          { area: 'Comercial', puntaje: 79, estado: 'mejorable', hallazgo: 'Pipeline poco estructurado para cuentas grandes.' },
          { area: 'Operaciones', puntaje: 86, estado: 'aceptable', hallazgo: 'Buen cumplimiento productivo.' },
          { area: 'Equipo', puntaje: 87, estado: 'fortaleza', hallazgo: 'Equipo flexible y con buena apertura.' },
        ],
        problemasCriticos: [{ problema: 'Prospeccion no sistematizada', impacto: 'Baja recurrencia de nuevas conversaciones.', urgencia: 'media' }],
        recomendaciones: [
          { accion: 'Disenar pipeline de exportacion', beneficioEsperado: 'Mayor visibilidad y avance comercial.', plazo: '30dias', prioridad: 'alta' },
        ],
        proximosPasos: ['Configurar pipeline B2B', 'Definir secuencia outbound'],
      },
      score: 83,
      summary: 'Negocio con potencial de expansion y necesidad de mayor sistema comercial.',
    },
    {
      pymeId: getUser('direccion@clinicadentalorigen.pe').id,
      responses: { sector: 'Salud', employees: 19, years: 5, techLevel: 5, challenges: 'Conversion de leads y no shows' },
      result: {
        resumenEjecutivo: 'Clinica Dental Origen necesita mejorar respuesta comercial y experiencia omnicanal.',
        puntajeGeneral: 80,
        areasEvaluadas: [
          { area: 'Experiencia de cliente', puntaje: 76, estado: 'mejorable', hallazgo: 'Respuesta irregular entre sedes.' },
          { area: 'Comercial', puntaje: 81, estado: 'aceptable', hallazgo: 'Hay demanda, pero bajo seguimiento sistematico.' },
          { area: 'Equipo', puntaje: 82, estado: 'aceptable', hallazgo: 'Necesitan entrenamiento homogeneo.' },
        ],
        problemasCriticos: [{ problema: 'No shows altos', impacto: 'Menor productividad de agenda.', urgencia: 'alta' }],
        recomendaciones: [
          { accion: 'Unificar script de primera llamada', beneficioEsperado: 'Mejor conversion y experiencia.', plazo: '30dias', prioridad: 'alta' },
        ],
        proximosPasos: ['Medir no shows por sede', 'Estandarizar respuesta comercial'],
      },
      score: 80,
      summary: 'La mejora comercial pasa por consistencia operacional y entrenamiento.',
    },
    {
      pymeId: getUser('admin@ecosmartcommerce.pe').id,
      responses: { sector: 'Retail digital', employees: 27, years: 4, techLevel: 7, challenges: 'Automatizar growth y reportes' },
      result: {
        resumenEjecutivo: 'EcoSmart Commerce tiene traccion digital, pero aun desperdicia valor por falta de automatizacion y CRO.',
        puntajeGeneral: 84,
        areasEvaluadas: [
          { area: 'Marketing', puntaje: 82, estado: 'aceptable', hallazgo: 'Buen volumen de trafico, baja automatizacion post-compra.' },
          { area: 'Analitica', puntaje: 78, estado: 'mejorable', hallazgo: 'Reportes dispersos entre canales.' },
          { area: 'Operaciones', puntaje: 87, estado: 'fortaleza', hallazgo: 'Fulfillment estable y orientado a eficiencia.' },
        ],
        problemasCriticos: [{ problema: 'Poca automatizacion de retencion', impacto: 'Menor LTV y conversion repetida.', urgencia: 'media' }],
        recomendaciones: [
          { accion: 'Activar flujos de recuperacion y post-compra', beneficioEsperado: 'Mayor conversion y recompra.', plazo: '30dias', prioridad: 'alta' },
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
    .where(and(inArray(diagnostic.summary, diagnosticValues.map((item) => item.summary)), isNull(diagnostic.deletedAt)));
  const existingDiagnosticSummaries = new Set(existingDiagnostics.map((item) => item.summary));

  if (diagnosticValues.some((item) => !existingDiagnosticSummaries.has(item.summary))) {
    await database
      .insert(diagnostic)
      .values(diagnosticValues.filter((item) => !existingDiagnosticSummaries.has(item.summary)));
  }

  return {
    users: seededUsers,
    pymes: pymeByName,
    consultants: consultantByName,
    meetings: meetingByTitle,
  };
}
