import * as bcrypt from 'bcrypt';
import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { user, User } from '@db/tables/user.table';

type SeededUserGroup = {
  admins: User[];
  pymes: User[];
  consultants: User[];
  byEmail: Record<string, User>;
};

const adminUsers = [{ email: 'admin@hubsme.com', name: 'Admin Hubsme', role: 'admin' as const }];

const pymeUsers = [
  { email: 'pyme@hubsme.com', name: 'Textiles del Sur SAC', role: 'pyme' as const },
  { email: 'contacto@tecnologistica.pe', name: 'TecnoLogistica Express', role: 'pyme' as const },
  { email: 'gerencia@alimentospacifico.pe', name: 'Alimentos Pacifico', role: 'pyme' as const },
  { email: 'operaciones@constructoranova.pe', name: 'Constructora Nova', role: 'pyme' as const },
  { email: 'equipo@bioandesfoods.pe', name: 'BioAndes Foods', role: 'pyme' as const },
  { email: 'direccion@clinicadentalorigen.pe', name: 'Clinica Dental Origen', role: 'pyme' as const },
  { email: 'admin@ecosmartcommerce.pe', name: 'EcoSmart Commerce', role: 'pyme' as const },
];

const consultantUsers = [
  { email: 'consultor@hubsme.com', name: 'Carlos Mendoza', role: 'consultor' as const },
  { email: 'ana.torres@hubsme.com', name: 'Ana Lucia Torres', role: 'consultor' as const },
  { email: 'roberto.sanchez@hubsme.com', name: 'Roberto Sanchez', role: 'consultor' as const },
  { email: 'elena.rivas@hubsme.com', name: 'Elena Rivas', role: 'consultor' as const },
  { email: 'marco.paredes@hubsme.com', name: 'Marco Paredes', role: 'consultor' as const },
  { email: 'valeria.soto@hubsme.com', name: 'Valeria Soto', role: 'consultor' as const },
];

export async function seedUsers(): Promise<SeededUserGroup> {
  const password = await bcrypt.hash('123456', 10);
  const seedEntries = [...adminUsers, ...pymeUsers, ...consultantUsers];
  const emails = seedEntries.map((entry) => entry.email);
  const existingUsers = await database
    .select()
    .from(user)
    .where(and(inArray(user.email, emails), isNull(user.deletedAt)));

  const existingByEmail = existingUsers.reduce<Record<string, User>>((acc, current) => {
    acc[current.email] = current;
    return acc;
  }, {});

  const values = seedEntries
    .filter((entry) => !existingByEmail[entry.email])
    .map((entry) => ({
      ...entry,
      password,
      isActive: 'true' as const,
    }));

  const insertedUsers = values.length > 0 ? await database.insert(user).values(values).returning() : [];

  const byEmail = [...existingUsers, ...insertedUsers].reduce<Record<string, User>>((acc, current) => {
    acc[current.email] = current;
    return acc;
  }, {});

  return {
    admins: adminUsers.map((item) => byEmail[item.email]),
    pymes: pymeUsers.map((item) => byEmail[item.email]),
    consultants: consultantUsers.map((item) => byEmail[item.email]),
    byEmail,
  };
}
