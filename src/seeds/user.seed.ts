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

const adminUsers: { email: string; name: string; firstName?: string; lastName?: string; role: 'admin' }[] = [];

const pymeUsers: { email: string; name: string; firstName?: string; lastName?: string; role: 'pyme' }[] = [
  { email: 'xerickcua@gmail.com', name: 'Erick Flores Santos', firstName: 'Erick', lastName: 'Flores Santos Flores Santos', role: 'pyme' },
];

const consultantUsers = [
  { email: 'miguel.salinas@hubsme.com', name: 'Miguel Salinas', firstName: 'Miguel', lastName: 'Salinas', role: 'consultor' as const },
  { email: 'ana.torres@hubsme.com', name: 'Ana Lucia Torres', firstName: 'Ana Lucia', lastName: 'Torres', role: 'consultor' as const },
  { email: 'roberto.sanchez@hubsme.com', name: 'Roberto Sanchez', firstName: 'Roberto', lastName: 'Sanchez', role: 'consultor' as const },
  { email: 'elena.rivas@hubsme.com', name: 'Elena Rivas', firstName: 'Elena', lastName: 'Rivas', role: 'consultor' as const },
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
