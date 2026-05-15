import { seedUsers } from '@seeds/user.seed';
import { seedConsultants } from '@seeds/consultant.seed';
import { seedSubscriptions } from '@seeds/subscription.seed';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...\n');

    console.log('🌱 Seeding Users...');
    const seededUsers = await seedUsers();

    console.log('🌱 Seeding Consultants...');
    await seedConsultants(seededUsers);

    console.log('🌱 Seeding Subscriptions...');
    await seedSubscriptions(seededUsers);

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
