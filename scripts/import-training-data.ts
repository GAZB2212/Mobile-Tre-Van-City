import { db } from "../server/db";
import { trainingOptions } from "@shared/schema";
import * as fs from "fs";

async function importTrainingData() {
  try {
    console.log("📥 Importing training data...");
    
    if (!fs.existsSync("training-data-export.json")) {
      console.error("❌ training-data-export.json not found!");
      console.log("Please upload the exported file first.");
      process.exit(1);
    }
    
    const jsonData = fs.readFileSync("training-data-export.json", "utf-8");
    const data = JSON.parse(jsonData);
    
    console.log(`Found ${data.length} training options to import`);
    
    // Use upsert to handle existing records
    for (const item of data) {
      await db
        .insert(trainingOptions)
        .values(item)
        .onConflictDoUpdate({
          target: trainingOptions.id,
          set: {
            name: item.name,
            description: item.description,
            type: item.type,
            durationDays: item.durationDays,
            includes: item.includes,
            price: item.price,
            published: item.published,
          },
        });
      
      console.log(`✓ Imported: ${item.name}`);
    }
    
    console.log(`\n✅ Successfully imported ${data.length} training options!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  }
}

importTrainingData();
