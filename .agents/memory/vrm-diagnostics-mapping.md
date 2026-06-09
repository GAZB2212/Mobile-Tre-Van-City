---
name: VRM diagnostics code mapping
description: Which Victron VRM diagnostics attribute codes/devices feed the 48V Power System dashboard tiles.
---

The admin "48V Power System" dashboard is built from the Victron VRM
`/v2/installations/{id}/diagnostics` response. Each record has `code`,
`description`, `formattedValue`, `rawValue`, and a `Device` name. The **same
`code` repeats across devices/instances**, so always select by code + a
preferred `Device`, with a code-only fallback.

**Why:** first-match `records.find(code)` is order-dependent and can surface the
wrong source (e.g. a `V`/`SOC`/`S` from a different device).

Tile → code (preferred Device):
- Grid power/voltage/current/frequency → `IP1` / `IV1` / `II1` / `IF1` (VE.Bus System)
- AC Loads power → `a1` (System overview); AC frequency → `OF` (VE.Bus System)
- Battery SOC → `SOC` (Battery Monitor); battery V/A → `bv`/`bc` (System overview)
- Battery temperature → `tsT` (Temperature sensor, type Battery) — NOT the VE.Bus `eT`, which is just an OK/alarm status
- DC system power → `dc` (System overview)
- System/charge state → `ss` (System overview) or `S` (VE.Bus System), e.g. "Bulk"

Computed (no direct code): battery power = batteryV × batteryA; DC current = dc ÷ batteryV.
Device field has appeared as `Device`/`device`/`deviceName` — match resiliently.
