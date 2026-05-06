import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { consultant, ConsultantDTO } from '@db/tables/consultant.table';
import { User } from '@db/tables/user.table';

export async function seedConsultants(seededUsers: { byEmail: Record<string, User> }) {
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

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
    .where(
      and(
        inArray(
          consultant.userId,
          consultantValues.map((item) => item.userId),
        ),
        isNull(consultant.deletedAt),
      ),
    );
  const existingConsultantUserIds = new Set(existingConsultants.map((item) => item.userId));

  if (consultantValues.some((item) => !existingConsultantUserIds.has(item.userId))) {
    await database
      .insert(consultant)
      .values(consultantValues.filter((item) => !existingConsultantUserIds.has(item.userId)));
  }

  const consultantRows = await database
    .select()
    .from(consultant)
    .where(
      and(
        inArray(
          consultant.userId,
          consultantValues.map((item) => item.userId),
        ),
        isNull(consultant.deletedAt),
      ),
    );

  return consultantRows.reduce<Record<string, (typeof consultantRows)[number]>>((acc, current) => {
    acc[current.name] = current;
    return acc;
  }, {});
}
