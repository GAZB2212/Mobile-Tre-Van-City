---
name: Configurator exclusive groups
description: How upgrade mutual-exclusivity works and why admin free-text attempts silently fail
---

# Configurator mutual exclusivity (upgrades)

Two upgrades are mutually exclusive only when they share the **exact same**
`exclusive_group` string (column `exclusive_group`, TS field `exclusiveGroup`).
Enforcement is client-side in `client/src/pages/configurator/SelectUpgrades.tsx`
(`getExclusiveGroup` falls back to the parent's group, so setting the group on a
parent covers all its variants; in production variants also carry it).

**Why admin edits don't reliably stick:** the canonical group values are
force-set on every server boot by idempotent UPDATEs in `server/index.ts`
(search `SET exclusive_group`). So a value typed in the admin Upgrades UI can be
overwritten on the next deploy/boot. Users have also mistyped a group as the
*other upgrade's name* or as a *category name* (e.g. `air-systems`), which never
matches because matching is exact-string, not by name.

**How to apply:** to add/change an exclusivity pairing permanently, add or edit a
boot migration block in `server/index.ts` matching by name pattern or stable id,
not via the admin UI. Production catalogue items differ from dev (dev has 0 of
these rows), so verify the WHERE against the production replica
(`executeSql({environment:"production"})`, read-only) before relying on row counts.
An upgrade can only be in ONE group, so a pairing change can break a prior pairing.
