import type { SkuComponent } from "./schema";

// Headline machines shown as an "Includes:" sub-line under the equipment
// pack name on the build sheet and on each kiosk card. The workshop needs to
// know at a glance which headline machines a quote actually ends up with —
// which depends on both the base pack AND any upgrades the customer picked
// that supersede the pack's stock machines (e.g. T4000 Pro tyre machine
// overrides the pack's standard tyre machine; Super Spin overrides the
// stock balancer; 48V Silent Compressor or 270L petrol compressor overrides
// the stock compressor).
//
// Resolution rules per category (tyre / balancer / compressor):
//   1. If any selected upgrade matches the category, it WINS — it's the
//      newer/upgraded machine the customer actually paid for.
//   2. Else if the kit has a non-empty `headlineMachines` admin override
//      array, take the entry from there whose text matches the category.
//   3. Else derive from the kit's BOM (`skuComponents`) by strict keyword
//      match — return the actual BOM description, not a generic label, so
//      packs read e.g. "Super Spin auto spin wheel balancer" not just
//      "Wheel Balancer".
//   4. Admin override entries that don't match any of the three categories
//      (admin freeform extras) are preserved and appended at the end.
//
// Output is rendered in fixed category order (tyre → balancer → compressor),
// capped at 3 entries total. Empty result → UI renders nothing.

export type MachineCategory = "tyre" | "balancer" | "compressor";

const CATEGORY_PATTERNS: Array<{ category: MachineCategory; pattern: RegExp }> = [
  // Tyre machine — matches "tyre changer", "tyre machine", and the T4000 /
  // T-4000 / T 4000 family of premium tyre machines.
  { category: "tyre",       pattern: /tyre[\s-]?(?:changer|machine)|\bt[\s-]?4000\b/i },
  // Balancer — covers "wheel balancer", plain "balancer", and "Super Spin"
  // (the upgraded balancer SKU).
  { category: "balancer",   pattern: /\bbalancer\b|super[\s-]?spin/i },
  // Compressor — covers "compressor" plus the two upgrade SKUs that
  // supersede the stock compressor: 48V silent system and the 270L petrol
  // electric compressor.
  { category: "compressor", pattern: /\bcompressor\b|\b48v\b|\b270\s?l(?:itre)?\b/i },
];

const CATEGORY_ORDER: MachineCategory[] = ["tyre", "balancer", "compressor"];
const MAX_HEADLINE_MACHINES = 3;

function categorize(text: string): MachineCategory | null {
  for (const { category, pattern } of CATEGORY_PATTERNS) {
    if (pattern.test(text)) return category;
  }
  return null;
}

export interface KitForHeadline {
  headlineMachines?: string[] | null;
  skuComponents?: SkuComponent[] | null;
}

export interface UpgradeForHeadline {
  name?: string | null;
  variantName?: string | null;
}

function upgradeLabel(u: UpgradeForHeadline): string {
  // Variant name (e.g. "270 Litre Petrol Electric") is the specific SKU the
  // customer chose under a parent like "Commercial Compressor" — prefer it
  // when present so the kiosk shows the exact machine, not the family name.
  const variant = (u.variantName ?? "").trim();
  const name = (u.name ?? "").trim();
  if (variant && name && !name.toLowerCase().includes(variant.toLowerCase())) {
    return `${name} — ${variant}`;
  }
  return variant || name;
}

export function deriveHeadlineMachines(
  kit: KitForHeadline | null | undefined,
  selectedUpgrades: UpgradeForHeadline[] = [],
): string[] {
  if (!kit) return [];

  const byCategory = new Map<MachineCategory, string>();
  const uncategorizedOverrides: string[] = [];

  // ── Step 1: seed from admin override (if set), otherwise from BOM ─────
  const override = (kit.headlineMachines ?? [])
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

  if (override.length > 0) {
    for (const entry of override) {
      const cat = categorize(entry);
      if (cat && !byCategory.has(cat)) {
        byCategory.set(cat, entry);
      } else if (!cat) {
        uncategorizedOverrides.push(entry);
      }
    }
  } else {
    const components = kit.skuComponents ?? [];
    for (const { category, pattern } of CATEGORY_PATTERNS) {
      if (byCategory.has(category)) continue;
      const hit = components.find((c) => pattern.test(c?.description ?? ""));
      const desc = (hit?.description ?? "").trim();
      if (desc) byCategory.set(category, desc);
    }
  }

  // ── Step 2: upgrade overrides win per category ────────────────────────
  // A selected upgrade matching a category replaces whatever was seeded
  // there — this is how Super Spin / T4000 / 48V / 270L supersede the
  // pack's stock machines on the build sheet and kiosk.
  for (const u of selectedUpgrades) {
    const label = upgradeLabel(u);
    if (!label) continue;
    const cat = categorize(label);
    if (cat) byCategory.set(cat, label);
  }

  // ── Step 3: assemble in fixed category order, cap at MAX ──────────────
  const result: string[] = [];
  for (const cat of CATEGORY_ORDER) {
    const v = byCategory.get(cat);
    if (v) result.push(v);
  }
  result.push(...uncategorizedOverrides);
  return result.slice(0, MAX_HEADLINE_MACHINES);
}
