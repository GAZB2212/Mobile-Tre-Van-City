import { db } from './db';
import * as schema from '@shared/schema';

const kits = [
  {
    id: "pack-1-non-euro6-t1000",
    name: "Pack 1 - Non Euro 6 with T1000 Pro & Mini Spin",
    description: "Complete mobile tyre fitting setup with T1000 Pro tyre changer and Mini Spin wheel balancer for Non Euro 6 vehicles",
    includes: ["T1000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Air Compressor", "Basic Tool Set"],
    powerKw: "3.5",
    price: 574500, // £5,745.00 in pence
    published: true,
  },
  {
    id: "pack-2-euro6-t1000",
    name: "Pack 2 - Euro 6 with T1000 Pro & Mini Spin",
    description: "Complete mobile tyre fitting setup with T1000 Pro tyre changer and Mini Spin wheel balancer for Euro 6 vehicles",
    includes: ["T1000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Euro 6 Compatible Air System", "Basic Tool Set"],
    powerKw: "3.5",
    price: 594500, // £5,945.00 in pence
    published: true,
  },
  {
    id: "pack-3-non-euro6-t2000",
    name: "Pack 3 - Non Euro 6 with T2000 Pro & Mini Spin",
    description: "Advanced mobile tyre fitting setup with T2000 Pro tyre changer and Mini Spin wheel balancer for Non Euro 6 vehicles",
    includes: ["T2000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "High-Capacity Air Compressor", "Professional Tool Set"],
    powerKw: "5.0",
    price: 644500, // £6,445.00 in pence
    published: true,
  },
  {
    id: "pack-4-euro6-t2000",
    name: "Pack 4 - Euro 6 with T2000 Pro & Mini Spin",
    description: "Premium mobile tyre fitting setup with T2000 Pro tyre changer and Mini Spin wheel balancer for Euro 6 vehicles",
    includes: ["T2000 Pro Tyre Changer", "Mini Spin Wheel Balancer", "Euro 6 Compatible High-Capacity Air System", "Professional Tool Set"],
    powerKw: "5.0",
    price: 664500, // £6,645.00 in pence
    published: true,
  }
];

async function seed() {
  console.log('Seeding kits...');
  
  for (const kit of kits) {
    await db.insert(schema.kits).values(kit).onConflictDoNothing();
  }
  
  console.log(`Successfully seeded ${kits.length} kits!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding kits:', err);
  process.exit(1);
});
