// Single source of truth for how an upgrade is labelled in the UI.
//
// In production several upgrades share the same parent `name` (e.g. all CCTV
// variants are stored as "Van Online CCTV/NVR System"), so when a `variantName`
// is present we prefer it as the primary visible label. Otherwise fall back to
// the upgrade's own `name`.
export function upgradeLabel(u: { name?: string | null; variantName?: string | null }): string {
  const v = (u?.variantName ?? "").trim();
  if (v) return v;
  return (u?.name ?? "").trim();
}
