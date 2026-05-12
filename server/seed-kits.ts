import { db } from './db';
import * as schema from '@shared/schema';
import { kitCatalog } from './seed-data/kit-catalog';

async function seed() {
  console.log('Seeding kits...');
  
  for (const kit of kitCatalog) {
    await db.insert(schema.kits).values(kit).onConflictDoNothing();
  }
  
  console.log(`Successfully seeded ${kitCatalog.length} kits!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding kits:', err);
  process.exit(1);
});
