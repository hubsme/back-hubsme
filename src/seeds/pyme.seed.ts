import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { pyme, PymeDTO } from '@db/tables/pyme.table';
import { User } from '@db/tables/user.table';

export async function seedPymes(seededUsers: { byEmail: Record<string, User> }) {
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
    .where(
      and(
        inArray(
          pyme.userId,
          pymeValues.map((item) => item.userId),
        ),
        isNull(pyme.deletedAt),
      ),
    );
  const existingPymeUserIds = new Set(existingPymes.map((item) => item.userId));

  if (pymeValues.some((item) => !existingPymeUserIds.has(item.userId))) {
    await database.insert(pyme).values(pymeValues.filter((item) => !existingPymeUserIds.has(item.userId)));
  }

  const pymeRows = await database
    .select()
    .from(pyme)
    .where(
      and(
        inArray(
          pyme.userId,
          pymeValues.map((item) => item.userId),
        ),
        isNull(pyme.deletedAt),
      ),
    );

  return pymeRows.reduce<Record<string, (typeof pymeRows)[number]>>((acc, current) => {
    acc[current.name] = current;
    return acc;
  }, {});
}
