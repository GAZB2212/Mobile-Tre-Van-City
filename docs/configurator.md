# The Configurator

## Step-by-Step Flow
1. **Select Van** — Choose from published stock inventory, or enter a personal van registration (UK DVLA lookup via CheckCarDetails API auto-populates make/model/year/specs)
2. **Select Service Type** — Define operational use:
   - **Car & Van Tyres** — standard light vehicles; proceeds to Kit selection
   - **Commercial Only** — HGVs and heavy fleet; skips Kit step entirely
   - **Car & Commercial (Hybrid)** — mixed fleet; requires a Kit plus commercial upgrades
3. **Select Kit** — Choose an equipment pack; Euro 6 compatibility is checked against the selected van, with a dialogue if there is a mismatch
4. **Select Upgrades** — Add branding, air systems, lighting, security, technology, and commercial extras; upgrades are filtered by service type and van size
5. **Select Training** — Add REACT or Tyre Fitting certification packages
6. **Select Finance** — Choose a finance plan and configure deposit/term for real-time monthly payment calculation
7. **Request Quote** — Review full spec with live pricing; submit contact details and preferred callback time

## State Architecture (`ConfiguratorContext.tsx`)
- State is persisted to `localStorage` under the key `configurator:v6`
- **Dual-slot comparison**: `slotA` and `slotB` allow side-by-side van comparisons; `slotB` inherits kit/upgrades from `slotA` — only the van differs
- Selecting a new van (`setVan`) resets all downstream selections to prevent incompatible states
- Switching service type (`setServiceType`) clears kit, upgrades, training, and finance
- Switching service type to "Commercial" in the admin edit panel clears the kit and updates pricing immediately
- Each slot holds: `vanId`, `serviceType`, `kitId`, `upgradeIds`, `upgradeQuantities`, `trainingOptionIds`, `financePlanId`, `financeInputs`, `pricingSnapshot`
- Share links (`?cfg=...`) take priority over localStorage on load

## Mutual Exclusivity Rules
Enforced via an `exclusiveGroup` field on upgrades in the database. Rules:

| Group | Members |
|---|---|
| `branding-wrap` | Full Wrap, Half Wrap, Graphic Pack (all variants — MWB and LWB) |
| `compressor-power-system` | Silent Compressor Upgrade (48V), Commercial Power Inversion Systems |

**Enforcement layers (newest to deepest):**
1. **Context-level resolution** — `ConfiguratorContext` fetches the upgrade catalogue and resolves all conflicts atomically in a `useEffect` on mount, before the user sees anything; covers stale localStorage and pre-loaded quote states
2. **Interactive handlers** — `handleUpgradeToggle` and `handleVariantSelect` in `SelectUpgrades.tsx` use the atomic `replaceUpgrades(toRemove[], toAdd)` method to prevent React 18 batching race conditions
3. **Toast notifications** — every auto-removal (exclusivity conflict, van-size mismatch, or stale-state cleanup) shows a named toast: *"Option removed — [X] has been removed as it can't be combined with [Y]"*
4. **Database-level assignment** — a startup migration (idempotent UPDATE) sets `exclusive_group` on the relevant upgrades on every server boot, including the production-only "Commercial Power Inversion Systems" upgrade matched by name pattern

**Admin Configurator (`AdminConfigurator.tsx`) additional guard:** when staff switch service type to "Commercial Only" while a kit is selected, a confirmation dialogue names the specific pack and asks to keep or remove it before proceeding.

## Quote Submission
- Pricing is calculated server-side (kit + upgrades + training + finance, with VAT and discount logic) — clients cannot manipulate totals
- Comparison quotes bundle both `slotA` and `slotB` configurations in a single `POST /api/quotes`
- The quote is linked to an active AI session (`ai-session-id` from localStorage) if one exists, for full conversion traceability
