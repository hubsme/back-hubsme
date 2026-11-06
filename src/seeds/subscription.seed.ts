import { database } from '@db/connection.db';
import { subscription } from '@db/tables/subscription.table';
import type { seedUsers } from '@seeds/user.seed';
import { and, inArray, isNull } from 'drizzle-orm';

import { DateFunction } from '@functions/date.function';

export async function seedSubscriptions(seededUsers: Pick<Awaited<ReturnType<typeof seedUsers>>, 'byEmail'>) {
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

  const subscriptionValues: (typeof subscription.$inferInsert)[] = [
    {
      userId: getUser('miguel.salinas@hubsme.com').id,
      plan: 'pro',
      status: 'active',
      startedAt: DateFunction.daysFromNow(-120),
      expiresAt: DateFunction.daysFromNow(245),
    },
    {
      userId: getUser('ana.torres@hubsme.com').id,
      plan: 'expert',
      status: 'active',
      startedAt: DateFunction.daysFromNow(-200),
      expiresAt: DateFunction.daysFromNow(160),
    },
    {
      userId: getUser('roberto.sanchez@hubsme.com').id,
      plan: 'basic',
      status: 'active',
      startedAt: DateFunction.daysFromNow(-75),
      expiresAt: DateFunction.daysFromNow(290),
    },
    {
      userId: getUser('elena.rivas@hubsme.com').id,
      plan: 'pro',
      status: 'paused',
      startedAt: DateFunction.daysFromNow(-140),
      expiresAt: DateFunction.daysFromNow(80),
    },
  ];

  const existingSubscriptions = await database
    .select()
    .from(subscription)
    .where(
      and(
        inArray(
          subscription.userId,
          subscriptionValues.map((item) => item.userId),
        ),
        isNull(subscription.deletedAt),
      ),
    );
  const existingSubscriptionUserIds = new Set(existingSubscriptions.map((item) => item.userId));

  if (subscriptionValues.some((item) => !existingSubscriptionUserIds.has(item.userId))) {
    await database
      .insert(subscription)
      .values(subscriptionValues.filter((item) => !existingSubscriptionUserIds.has(item.userId)));
  }
}
