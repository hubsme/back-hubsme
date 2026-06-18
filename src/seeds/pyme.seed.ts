import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { pyme } from '@db/tables/pyme.table';
import { User } from '@db/tables/user.table';

export async function seedPymes(users: { byEmail: Record<string, User> }) {
  const pymesData = [
    {
      email: 'xerickcua@gmail.com',
      data: {
        name: 'Erick',
        ruc: '10727506239',
        ownerFirstName: 'Erick',
        ownerLastName: 'Flores',
        ownerEmail: 'xerickcua@gmail.com',
        ownerPhone: '51929073820',
        ownerPosition: 'Administrador',
      },
    },
  ];

  const valuesToInsert = pymesData
    .map((item) => {
      const user = users.byEmail[item.email];
      if (!user) return null;
      return {
        ...item.data,
        id: user.id,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (valuesToInsert.length === 0) return {};

  const existingPymes = await database
    .select()
    .from(pyme)
    .where(
      and(
        inArray(
          pyme.id,
          valuesToInsert.map((v) => v.id),
        ),
        isNull(pyme.deletedAt),
      ),
    );

  const existingUserIds = existingPymes.map((p) => p.id);
  const newValues = valuesToInsert.filter((v) => !existingUserIds.includes(v.id));

  if (newValues.length > 0) {
    await database.insert(pyme).values(newValues);
  }

  return {};
}
