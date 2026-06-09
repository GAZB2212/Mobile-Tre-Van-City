---
name: 48V power-system upgrade identity
description: How to reliably detect a 48V (Silent Compressor) customer/quote — production stores this upgrade under multiple UUIDs, not a slug.
---

# Detecting the 48V "Silent Compressor – Advanced 48V Power System" upgrade

A customer/quote is "48V" if any quote's `selected_upgrade_ids` references the
Silent Compressor 48V power system. Do NOT match the literal slug
`silent-compressor-upgrade` — production has ZERO quotes containing that string.

**Reality in production:** the upgrade exists as several duplicate `upgrades` rows,
all named exactly `Silent Compressor Upgrade – Advanced 48V Power System`, each with
a different UUID id. Quotes reference those UUIDs. SKUs for them: `MTVC-U044`,
`MTVC-U021`, `MTVC-U072`. There is also a published 4th duplicate with the SAME name
but NO SKU (still referenced by real quotes).

**Reliable match:** select upgrade ids where
`sku IN ('MTVC-U044','MTVC-U021','MTVC-U072') OR name ILIKE '%48V Power System%'`,
then check intersection with each quote's `selected_upgrade_ids`. The name pattern
catches the no-SKU duplicate; the SKU list survives a future rename.

**Why:** `selected_upgrade_ids` mixes human slugs (e.g. `air-reel-fini`,
`super-spin-upgrade`) AND opaque UUIDs. The 48V upgrade only ever appears as UUIDs.
The exclusive_group `48v-lithium-power` is NOT a usable signal — it also contains
"Lithium Battery Upgrade", which is a different product.

**How to apply:** any 48V eligibility check (admin CRM VRM card, reporting, etc.)
must resolve the upgrade id set from the DB by SKU/name, never hardcode a slug.
