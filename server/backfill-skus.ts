import { db } from './db';
import { kits, upgrades } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { log } from './vite';
import { kitCatalog } from './seed-data/kit-catalog';
import { upgradeCatalog } from './seed-data/upgrade-catalog';

export async function backfillSkus(): Promise<void> {
  let kitsUpdated = 0;
  let upgradesUpdated = 0;
  let failed = 0;

  for (const kit of kitCatalog) {
    try {
      const rows = await db
        .update(kits)
        .set({ sku: kit.sku, skuComponents: kit.skuComponents ?? null })
        .where(eq(kits.id, kit.id))
        .returning({ id: kits.id });
      if (rows.length > 0) kitsUpdated++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SKU backfill] Failed to update kit ${kit.id}:`, message);
      failed++;
    }
  }

  for (const upgrade of upgradeCatalog) {
    try {
      const rows = await db
        .update(upgrades)
        .set({ sku: upgrade.sku, skuComponents: upgrade.skuComponents ?? null })
        .where(eq(upgrades.id, upgrade.id))
        .returning({ id: upgrades.id });
      if (rows.length > 0) upgradesUpdated++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SKU backfill] Failed to update upgrade ${upgrade.id}:`, message);
      failed++;
    }
  }

  const failNote = failed > 0 ? `, ${failed} failed` : '';
  log(`✅ SKU backfill complete: ${kitsUpdated} kit(s) and ${upgradesUpdated} upgrade(s) updated${failNote}`);
}
