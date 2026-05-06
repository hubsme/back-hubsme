import { seedUsers } from '@seeds/user.seed';
import { seedPymes } from '@seeds/pyme.seed';
import { seedConsultants } from '@seeds/consultant.seed';
import { seedSubscriptions } from '@seeds/subscription.seed';
import { seedMeetings } from '@seeds/meeting.seed';
import { seedTasks } from '@seeds/task.seed';
import { seedDiagnostics } from '@seeds/diagnostic.seed';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...\n');

    console.log('🌱 Seeding Users...');
    const seededUsers = await seedUsers();

    console.log('🌱 Seeding Pymes...');
    await seedPymes(seededUsers);

    console.log('🌱 Seeding Consultants...');
    await seedConsultants(seededUsers);

    console.log('🌱 Seeding Subscriptions...');
    await seedSubscriptions(seededUsers);

    console.log('🌱 Seeding Meetings...');
    const meetings = await seedMeetings(seededUsers);

    console.log('🌱 Seeding Tasks...');
    await seedTasks(seededUsers, meetings);

    console.log('🌱 Seeding Diagnostics...');
    await seedDiagnostics(seededUsers);

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
