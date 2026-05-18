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
      userId: getUser('miguel.salinas@hubsme.com').id,
      firstName: 'Miguel',
      lastName: 'Salinas',
      fullName: 'Miguel Salinas',
      bio: 'Consultor en transformacion digital, procesos y crecimiento para PYMES.',
      specialties: ['Tecnologia', 'Operaciones', 'Estrategia'],
      sectors: ['Retail', 'Manufactura', 'Logistica'],
      photoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/photos/image_01_1778862459411.jpeg',
      videoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/videos/video_01_1778861936432.mp4',
      pricePerHour: '150.00',
      rating: '0.00',
      totalReviews: 0,
      active: 'true',
      validated: 'true',
    },
    {
      userId: getUser('ana.torres@hubsme.com').id,
      firstName: 'Ana Lucia',
      lastName: 'Torres',
      fullName: 'Ana Lucia Torres',
      bio: 'Especialista en finanzas, control de gestion y estructuras de rentabilidad para empresas en expansion.',
      specialties: ['Finanzas', 'Planeamiento', 'Control de gestion'],
      sectors: ['Servicios', 'Salud', 'Alimentos'],
      photoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/photos/image_03_1778862478554.jpeg',
      videoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/videos/video_03_1778862111466.mov',
      pricePerHour: '180.00',
      rating: '0.00',
      totalReviews: 0,
      active: 'true',
      validated: 'true',
    },
    {
      userId: getUser('roberto.sanchez@hubsme.com').id,
      firstName: 'Roberto',
      lastName: 'Sanchez',
      fullName: 'Roberto Sanchez',
      bio: 'Experto en operaciones, supply chain y productividad para negocios con multiples frentes operativos.',
      specialties: ['Operaciones', 'Supply chain', 'Productividad'],
      sectors: ['Manufactura', 'Construccion', 'Logistica'],
      photoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/photos/image_02_1778862501750.jpeg',
      videoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/videos/video_02_1778862155700.mov',
      pricePerHour: '165.00',
      rating: '0.00',
      totalReviews: 0,
      active: 'true',
      validated: 'true',
    },
    {
      userId: getUser('elena.rivas@hubsme.com').id,
      firstName: 'Elena',
      lastName: 'Rivas',
      fullName: 'Elena Rivas',
      bio: 'Consultora en recursos humanos, cultura organizacional y desarrollo de liderazgo.',
      specialties: ['RRHH', 'Cultura', 'Liderazgo'],
      sectors: ['Servicios', 'Salud', 'Retail digital'],
      photoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/photos/image_04_1778862546158.jpeg',
      videoUrl:
        'https://storagetransporte.blob.core.windows.net/storagetransporte/consultants/videos/video_04_1778862185047.mov',
      pricePerHour: '135.00',
      rating: '0.00',
      totalReviews: 0,
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
    acc[current.fullName] = current;
    return acc;
  }, {});
}
