# Technical Implementation Notes

## Startup Migrations (`server/index.ts`)
Every server boot runs a sequence of idempotent migrations (CREATE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS / UPDATE WHERE):

**Tables created on first boot:**
`upgrade_categories`, `follow_ups`, `ai_conversations`, `blog_posts`, `ai_packages`, `testimonials`, `customers`, `customer_notes`, `customer_merge_history`, `artwork_proofs`, `artwork_proof_messages`

**Column additions (all idempotent):**
- `analytics_sessions`: `is_admin`
- `quotes`: spec approval tokens, Sage invoice/push fields, AutoTradeOS push history, customer/AI session linking, staff name, custom extras, finance portal columns, reassignment audit columns
- `leads`: quote linking, customer linking, status change timestamp, reassignment audit
- `ai_conversations`: customer linking, contacted note, reassignment audit
- `gallery_items`: `featured`
- `users`: `dashboard_tab` preference
- `kits` and `upgrades`: `sku` (TEXT), `sku_components` (JSONB) for the BOM system
- `kits`: `headline_machines` (TEXT[]) — admin override for the "Includes:" line on build sheet and kiosk

**Data sync on every boot:**
- `backfillSkus()` — ensures all kits and upgrades have auto-generated SKUs
- Exclusive group assignment — sets `exclusive_group = 'compressor-power-system'` on Silent Compressor and any upgrade matching `%commercial power inversion%` or `%power inversion system%` name patterns
- Customer backfill — links orphaned leads/quotes/AI conversations to Customer records by email/phone; creates new Customer records where missing
- Reassignment history backfill — populates JSONB audit arrays from legacy single-column audit fields
- AI quote repricing — recalculates totals for quotes with a £0 estimate caused by session timeouts
- AI draft creation — creates Draft quotes for AI conversations with `config_completed = TRUE` that were never formally submitted
- Unique partial indexes on `customers(email)` and `customers(phone)` (where `deleted_at IS NULL`)

## Post-Merge Setup (`scripts/post-merge.sh`)
```bash
#!/bin/bash
set -e
npm install
npx drizzle-kit push --force
```
Configured timeout: **60 seconds** (set via `.replit` post-merge config).

## State Management & React 18 Production Optimisation
- The configurator uses a custom `replaceUpgrades(toRemove[], toAdd)` method for all mutually exclusive upgrade swaps — a single atomic state update prevents race conditions from React 18's aggressive state batching
- Issue history (November 2025): production builds were allowing two mutually exclusive upgrades to be selected simultaneously due to multiple `removeUpgrade` + `addUpgrade` calls being batched unpredictably; fixed by the atomic `replaceUpgrades` approach

## Headline Machines (`shared/kitHeadlineMachines.ts`)
Shared helper used by both `/admin/quotes/:id/build-sheet` and `/kiosk/pipeline/:token` to surface the headline machines of a pack as an "Includes:" sub-line.

Resolution order:
1. If the kit's `headlineMachines` override array is non-empty, use it verbatim (admin-curated, set in `/admin/kits`).
2. Otherwise derive from `skuComponents` by strict keyword match (tyre changer/machine, balancer, compressor), returning the actual BOM description (not a generic label) — capped at 3 entries, deduped.
3. Empty array → UI renders nothing.

The kiosk also repeats the same line under the Install-Pack stage row so the workshop sees the actual machine models against the build stage they relate to.

## Media Serving
- Backend proxy routes: `/media/:filename` for static assets, `/objects/:objectPath` for GCS-hosted content
- Video streaming with HTTP Range request support
- ACL checks on uploaded objects before serving

## Database Seeding
- Run `tsx server/seed-upgrades.ts` to manually reseed upgrade data
- Parent items for variant groups **must** have `published: true` for child variants to appear in configurator dropdowns

## Key Files Reference

| File | Purpose |
|---|---|
| `server/index.ts` | Express app entry, startup migrations, session setup |
| `server/routes.ts` | All API routes, Max AI system prompt, pricing engine |
| `server/auth.ts` | Authentication, session handling, role enforcement |
| `server/storage.ts` | Database access layer (all CRUD operations) |
| `shared/schema.ts` | Drizzle schema — all tables, types, Zod insert schemas |
| `shared/kitHeadlineMachines.ts` | Headline-machine resolution helper (override → BOM derivation) |
| `client/src/lib/ConfiguratorContext.tsx` | Global configurator state, conflict resolution, dual-slot compare |
| `client/src/lib/aiConfiguratorMapping.ts` | AI output → configurator state translation |
| `client/src/pages/configurator/SelectUpgrades.tsx` | Upgrade selection UI, exclusivity enforcement, toast notifications |
| `client/src/pages/admin/QuoteDetail.tsx` | Full quote lifecycle management |
| `client/src/pages/admin/AdminConfigurator.tsx` | Staff-side configurator with service-type guards |
| `client/src/pages/admin/AIConversations.tsx` | AI session review and quote conversion |
| `client/src/pages/admin/BuildSheet.tsx` | Workshop build sheet with BOM and headline machines |
| `client/src/pages/KioskPipelineBoard.tsx` | Workshop floor kiosk view |
| `client/src/components/AIChatWidget.tsx` | Max AI floating chat interface |
| `server/ssr-prefetch.ts` | SSR data prefetch route mappings |
| `client/src/entry-server.tsx` | SSR render entry point |
| `scripts/post-merge.sh` | Post-merge dependency install and schema push |
