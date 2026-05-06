import { seedHubsmeData } from '@seeds/hubsme.seed';

async function seed() {
  try {
    console.log('🚀 Starting database seeding...\n');

    await seedHubsmeData();

    console.log('\n✨ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
