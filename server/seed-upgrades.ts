import { db } from './db';
import * as schema from '@shared/schema';
import { upgradeCatalog } from './seed-data/upgrade-catalog';

async function seed() {
  console.log('Seeding upgrades...');
  
  for (const upgrade of upgradeCatalog) {
    await db.insert(schema.upgrades).values(upgrade).onConflictDoNothing();
  }
  
  console.log(`Successfully seeded ${upgradeCatalog.length} upgrades!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding upgrades:', err);
  process.exit(1);
});
