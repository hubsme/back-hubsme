import { and, inArray, isNull } from 'drizzle-orm';
import { database } from '@db/connection.db';
import { subscription, SubscriptionDTO } from '@db/tables/subscription.table';
import { User } from '@db/tables/user.table';
import { daysFromNow } from '@functions/date.function';

export async function seedSubscriptions(seededUsers: { byEmail: Record<string, User> }) {
  const getUser = (email: string) => {
    const found = seededUsers.byEmail[email];
    if (!found) throw new Error(`Usuario no encontrado en seed: ${email}`);
    return found;
  };

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
