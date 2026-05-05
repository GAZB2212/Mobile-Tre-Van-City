import { pool } from "./db";

export interface PackageTierStats {
  id: string;
  name: string;
  tier: number;
  count: number;
  pct: number;
}

export interface PopularityIntelligence {
  totalMeaningfulQuotes: number;
  topUpgradesOverall: Array<{ id: string; name: string; count: number; pct: number }>;
  topUpgradesByServiceType: Record<string, Array<{ id: string; name: string; count: number; pct: number }>>;
  mostChosenKit: { id: string; name: string; pct: number } | null;
  rate48v: number;
  popularUpgradeIds: string[];
  packageTierDistribution: PackageTierStats[];
  dominantPackageTier: PackageTierStats | null;
}

// In-memory guard: only sync the popular flag once per hour
let lastPopularSyncAt = 0;
const POPULAR_SYNC_INTERVAL_MS = 60 * 60 * 1000;

export async function computePopularityIntelligence(): Promise<PopularityIntelligence> {
  // Fetch the last 200 meaningful quotes (not cancelled, has at least a kit or upgrade)
  // and fetch active packages in parallel
  const [result, packagesResult, all48vResult] = await Promise.all([
    pool.query<{
      kit_id: string | null;
      selected_upgrade_ids: string[] | string | null;
      service_type: string | null;
    }>(`
      SELECT kit_id, selected_upgrade_ids, service_type
      FROM quotes
      WHERE status != 'cancelled'
        AND (
          kit_id IS NOT NULL
          OR (selected_upgrade_ids IS NOT NULL AND selected_upgrade_ids::text != '[]' AND selected_upgrade_ids::text != 'null')
        )
      ORDER BY created_at DESC
      LIMIT 200
    `),
    pool.query<{ id: string; name: string; tier: number; upgrade_ids: string[] | string }>(
      `SELECT id, name, tier, upgrade_ids FROM ai_packages WHERE active = TRUE ORDER BY tier ASC`
    ),
    pool.query<{ id: string }>(
      `SELECT id FROM upgrades WHERE LOWER(name) LIKE '%48v%' OR LOWER(name) LIKE '%48 v%' OR LOWER(name) LIKE '%silent compressor%' OR LOWER(name) LIKE '%silent air%'`
    ),
  ]);

  const rows = result.rows;
  const total = rows.length;
  const ids48v = new Set(all48vResult.rows.map(r => r.id));

  // Parse upgrade_ids from ai_packages (may be JSON string or array)
  function parseIds(raw: string[] | string | null): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  const packages = packagesResult.rows.map(p => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    upgradeIds: parseIds(p.upgrade_ids),
  }));

  if (total === 0) {
    return {
      totalMeaningfulQuotes: 0,
      topUpgradesOverall: [],
      topUpgradesByServiceType: {},
      mostChosenKit: null,
      rate48v: 0,
      popularUpgradeIds: [],
      packageTierDistribution: [],
      dominantPackageTier: null,
    };
  }

  // Count upgrade frequencies overall and by service type
  const overallCounts: Record<string, number> = {};
  const byServiceType: Record<string, Record<string, number>> = {};
  const kitCounts: Record<string, number> = {};
  const packageTierCounts: Record<string, number> = {};

  for (const row of rows) {
    const ids = parseIds(row.selected_upgrade_ids);
    const idSet = new Set(ids);
    const st = row.service_type ?? "unknown";

    // Kit frequency
    if (row.kit_id) {
      kitCounts[row.kit_id] = (kitCounts[row.kit_id] ?? 0) + 1;
    }

    // Upgrade frequency overall
    for (const id of ids) {
      overallCounts[id] = (overallCounts[id] ?? 0) + 1;
    }

    // Upgrade frequency by service type
    if (!byServiceType[st]) byServiceType[st] = {};
    for (const id of ids) {
      byServiceType[st][id] = (byServiceType[st][id] ?? 0) + 1;
    }

    // Package tier classification: find which package best matches this quote's upgrades.
    // Score = how many of the package's upgrade IDs are present in the quote (containment).
    // A quote is classified as a package if at least 50% of that package's upgrades are present.
    // Prefer higher tier on ties (more capable = more likely intentional).
    if (ids.length > 0 && packages.length > 0) {
      let bestPackage: typeof packages[0] | null = null;
      let bestScore = 0;

      for (const pkg of packages) {
        if (pkg.upgradeIds.length === 0) continue;
        const intersection = pkg.upgradeIds.filter(uid => idSet.has(uid)).length;
        const containment = intersection / pkg.upgradeIds.length;
        if (containment > bestScore || (containment === bestScore && bestPackage && pkg.tier > bestPackage.tier)) {
          bestScore = containment;
          bestPackage = pkg;
        }
      }

      if (bestPackage && bestScore >= 0.5) {
        packageTierCounts[bestPackage.id] = (packageTierCounts[bestPackage.id] ?? 0) + 1;
      }
    }
  }

  // Fetch upgrade names so we can label them
  const upgradeIdsNeeded = Object.keys(overallCounts);
  let upgradeNames: Record<string, string> = {};
  if (upgradeIdsNeeded.length > 0) {
    const upResult = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM upgrades WHERE id = ANY($1)`,
      [upgradeIdsNeeded]
    );
    for (const r of upResult.rows) {
      upgradeNames[r.id] = r.name;
    }
  }

  // Fetch kit names
  const kitIdsNeeded = Object.keys(kitCounts);
  let kitNames: Record<string, string> = {};
  if (kitIdsNeeded.length > 0) {
    const kitResult = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM kits WHERE id = ANY($1)`,
      [kitIdsNeeded]
    );
    for (const r of kitResult.rows) {
      kitNames[r.id] = r.name;
    }
  }

  // Top upgrades overall (top 8)
  const topUpgradesOverall = Object.entries(overallCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, count]) => ({
      id,
      name: upgradeNames[id] ?? id,
      count,
      pct: Math.round((count / total) * 100),
    }));

  // Top upgrades by service type (top 5 each)
  const topUpgradesByServiceType: Record<string, Array<{ id: string; name: string; count: number; pct: number }>> = {};
  for (const [st, counts] of Object.entries(byServiceType)) {
    const stTotal = rows.filter(r => (r.service_type ?? "unknown") === st).length;
    topUpgradesByServiceType[st] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        id,
        name: upgradeNames[id] ?? id,
        count,
        pct: Math.round((count / stTotal) * 100),
      }));
  }

  // Most chosen kit
  let mostChosenKit: { id: string; name: string; pct: number } | null = null;
  const kitEntries = Object.entries(kitCounts).sort((a, b) => b[1] - a[1]);
  if (kitEntries.length > 0) {
    const [topKitId, topKitCount] = kitEntries[0];
    mostChosenKit = {
      id: topKitId,
      name: kitNames[topKitId] ?? topKitId,
      pct: Math.round((topKitCount / total) * 100),
    };
  }

  // 48V selection rate
  const quotesWithAny48v = rows.filter(row => {
    const ids = parseIds(row.selected_upgrade_ids);
    return ids.some(id => ids48v.has(id));
  }).length;
  const rate48v = Math.round((quotesWithAny48v / total) * 100);

  // Package tier distribution — count of classified quotes per tier
  const classifiedTotal = Object.values(packageTierCounts).reduce((s, c) => s + c, 0);
  const packageTierDistribution: PackageTierStats[] = packages
    .map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier,
      count: packageTierCounts[pkg.id] ?? 0,
      pct: classifiedTotal > 0 ? Math.round(((packageTierCounts[pkg.id] ?? 0) / classifiedTotal) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const dominantPackageTier = packageTierDistribution.find(p => p.count > 0) ?? null;

  // Top 5 upgrade IDs by count (for popular flag sync)
  const popularUpgradeIds = Object.entries(overallCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  // Sync popular flag on upgrades (throttled to once per hour).
  // Always runs the update — clears stale popular flags even if no upgrades were
  // selected in the recent window (popularUpgradeIds will be empty in that case).
  const now = Date.now();
  if (now - lastPopularSyncAt >= POPULAR_SYNC_INTERVAL_MS) {
    lastPopularSyncAt = now;
    try {
      if (popularUpgradeIds.length > 0) {
        await pool.query(
          `UPDATE upgrades SET popular = (id = ANY($1))`,
          [popularUpgradeIds]
        );
        console.log(`[popularity] Synced popular flag — top upgrades: ${popularUpgradeIds.join(", ")}`);
      } else {
        // No upgrade data in recent window — clear all popular flags to avoid stale state
        await pool.query(`UPDATE upgrades SET popular = false`);
        console.log(`[popularity] Cleared all popular flags (no upgrade data in recent window)`);
      }
    } catch (err) {
      console.error("[popularity] Failed to sync popular flags:", err);
    }
  }

  return {
    totalMeaningfulQuotes: total,
    topUpgradesOverall,
    topUpgradesByServiceType,
    mostChosenKit,
    rate48v,
    popularUpgradeIds,
    packageTierDistribution,
    dominantPackageTier,
  };
}

export function formatPopularityBlock(intel: PopularityIntelligence): string {
  if (intel.totalMeaningfulQuotes === 0) {
    return "POPULARITY INTELLIGENCE: No quote data yet — use general best-practice recommendations.";
  }

  const lines: string[] = [
    `POPULARITY INTELLIGENCE (based on ${intel.totalMeaningfulQuotes} real customer quotes — use this to nudge recommendations with confidence):`,
  ];

  if (intel.mostChosenKit) {
    lines.push(`- Most chosen kit: "${intel.mostChosenKit.name}" (selected by ${intel.mostChosenKit.pct}% of customers)`);
  }

  // Package tier distribution
  if (intel.packageTierDistribution.some(p => p.count > 0)) {
    const tierLine = intel.packageTierDistribution
      .filter(p => p.count > 0)
      .map(p => `${p.name} ${p.pct}%`)
      .join(", ");
    lines.push(`- Package tier distribution: ${tierLine}`);
    if (intel.dominantPackageTier && intel.dominantPackageTier.pct >= 50) {
      lines.push(`  → ${intel.dominantPackageTier.name} is the dominant tier — lead with it in recommendations`);
    }
  }

  if (intel.rate48v > 0) {
    lines.push(`- 48V silent compressor system: chosen by ${intel.rate48v}% of recent customers`);
    if (intel.rate48v >= 60) {
      lines.push(`  → STRONG signal: majority choose 48V — pitch it confidently and early`);
    } else if (intel.rate48v >= 40) {
      lines.push(`  → Solid majority — recommend it proactively, frame as standard choice`);
    }
  }

  if (intel.topUpgradesOverall.length > 0) {
    const topNames = intel.topUpgradesOverall.slice(0, 5).map(u => `"${u.name}" (${u.pct}%)`).join(", ");
    lines.push(`- Top upgrades overall (% of quotes that include them): ${topNames}`);
  }

  const serviceTypes = ["car", "commercial", "hybrid"];
  for (const st of serviceTypes) {
    const top = intel.topUpgradesByServiceType[st];
    if (top && top.length > 0) {
      const label = st === "car" ? "car/light-van" : st === "commercial" ? "commercial/HGV" : "hybrid/mixed";
      const names = top.slice(0, 3).map(u => `"${u.name}" (${u.pct}%)`).join(", ");
      lines.push(`- Top upgrades among ${label} customers: ${names}`);
    }
  }

  lines.push(
    ``,
    `USING THIS DATA: When an upgrade appears in 50%+ of quotes, mention it proactively as "our most popular choice". When 70%+ of a customer's service-type segment chooses something, say "most [commercial/car] operators go for this". For package tiers, if one tier dominates, lead with it and reference real patterns: "most of our customers go with [tier]". Never cite raw percentages to the customer — translate into natural sales language: "most", "the majority", "eight out of ten", "our most popular setup".`
  );

  return lines.join("\n");
}
