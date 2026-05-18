# Mobile Tyre Van City — Platform Documentation

## Overview

A full-stack, production web platform for **Mobile Tyre Van City**, a UK business specialising in custom mobile tyre van conversions. The platform serves two audiences:

- **Customers** — browse van stock, use an interactive multi-step configurator or AI chat assistant to design a bespoke conversion, and submit quote requests.
- **Staff & Partners** — manage the entire business workflow from initial enquiry through specification, pricing, finance, build, and completion via a comprehensive admin panel.

Primary business goals: lead generation, quote conversion, and operational efficiency across the full sales-to-build pipeline.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query (server state) + React Context (configurator state)
- **Forms**: React Hook Form with Zod validation
- **UI/UX**: Mobile-first responsive design with industrial/automotive styling, optimised images, interactive multi-step configurator with real-time pricing
- **Interactive Tutorial**: `react-joyride` for onboarding users through the configurator (progress persisted in localStorage)

### Backend
- **Runtime**: Node.js with Express in TypeScript
- **API Design**: RESTful
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Replit built-in, via `pg` / `drizzle-orm/node-postgres`)
- **Session Management**: Express sessions — memory store in development, PostgreSQL (`connect-pg-simple`) in production

---

## Public-Facing Pages

### Customer Journey Pages
- **Home / Landing** (`/`) — Hero video, value proposition, testimonials, gallery preview, CTA to configurator
- **Van Stock** (`/stock`) — Full inventory listing with search and filters
- **Van Details** (`/stock/:slug`) — Individual vehicle page with specs, gallery, and direct configurator CTA
- **Gallery** (`/gallery`) — Portfolio of completed builds with image/video lightbox
- **Blog** (`/blog`, `/blog/:slug`) — AI-generated and editorial content with full SEO support

### Configurator Flow
Seven-step interactive build wizard (see Configurator section below):
`/configurator/van` → `/configurator/service-type` → `/configurator/kit` → `/configurator/upgrades` → `/configurator/training` → `/configurator/finance` → `/configurator/quote`
An AI-powered review step (`/configurator/ai-review`) is available when entering via the Max AI assistant.

### Information Pages
- `/about` — Company background
- `/training` — REACT (motorway operations) and Tyre Fitting certification details
- `/how-it-works` — Process explanation
- `/business-opportunity` — Franchise/investment angle
- `/finance` — Finance product overview
- `/contact` — Enquiry form and contact details

### Programmatic SEO Landing Pages
- `/van-conversions` — Hub page for van conversion searches
- `/van-conversions/:slug` — Per-model pages (e.g. Ford Transit, Vauxhall Movano)
- `/mobile-tyre-vans` — Hub page for mobile tyre van searches
- `/mobile-tyre-vans/:slug` — Per-location pages (e.g. Liverpool, Manchester)

### Policy Pages
- `/privacy-policy`, `/terms`, `/cookie-policy`

### Customer-Facing Approval Pages (token-gated, no login required)
- `/spec-approval/:token` — Customer reviews and approves or flags their build specification
- `/artwork-approval/:token` — Customer reviews and approves graphics/wrap artwork proofs
- `/build-progress/:token` — QR-accessible build milestone tracker for the customer

---

## The Configurator

### Step-by-Step Flow
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

### State Architecture (`ConfiguratorContext.tsx`)
- State is persisted to `localStorage` under the key `configurator:v6`
- **Dual-slot comparison**: `slotA` and `slotB` allow side-by-side van comparisons; `slotB` inherits kit/upgrades from `slotA` — only the van differs
- Selecting a new van (`setVan`) resets all downstream selections to prevent incompatible states
- Switching service type (`setServiceType`) clears kit, upgrades, training, and finance
- Switching service type to "Commercial" in the admin edit panel clears the kit and updates pricing immediately
- Each slot holds: `vanId`, `serviceType`, `kitId`, `upgradeIds`, `upgradeQuantities`, `trainingOptionIds`, `financePlanId`, `financeInputs`, `pricingSnapshot`
- Share links (`?cfg=...`) take priority over localStorage on load

### Mutual Exclusivity Rules
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

### Quote Submission
- Pricing is calculated server-side (kit + upgrades + training + finance, with VAT and discount logic) — clients cannot manipulate totals
- Comparison quotes bundle both `slotA` and `slotB` configurations in a single `POST /api/quotes`
- The quote is linked to an active AI session (`ai-session-id` from localStorage) if one exists, for full conversion traceability

---

## Max AI Assistant

An AI-powered conversational configurator ("Max") that guides customers through building a van specification via natural language, then maps the conversation directly to the product catalogue.

### Customer Experience
- **AIChatWidget** — floating chat button (bottom-right on all public pages); persists via `localStorage` (`ai-chat:v1`) and `navigator.sendBeacon` on page exit
- Pre-chat lead capture (Name + Phone) secures contact data before any conversation begins
- A "Summary Card" appears near the end showing the proposed van, kit, extras, and payment preference
- "View your configuration" syncs Max's choices into the standard configurator for review, then the customer submits via the normal quote flow

### The 9-Question Conversation Flow
| Step | Question |
|---|---|
| Q0 | Name (if not already captured) |
| Q1 | Purpose — starting out, expanding, or replacing |
| Q2 / Q2b | Daily workload and vehicle types (car vs. commercial) |
| Q3 / Q3a | Van supply and year (determines Euro 6 status) |
| Q4 | Van size — MWB or LWB |
| Q5 | Tyre machine preference — semi-auto or fully-auto |
| Q6 / Q6b | Package recommendation and van branding (Graphic Pack / Half Wrap / Full Wrap) |
| Q7 | 48V Lithium Silent Compressor pitch |
| Q8 / Q9 | Finance preference and callback number |

**Q6b branding mapping** — wrap prices and upgrade IDs differ by van size (MWB vs LWB). The system prompt contains a hard-coded UUID table per van size so Max always outputs the correct variant ID, preventing the wrong SKU entering a quote.

### System Prompt
Built dynamically in `server/routes.ts` and injected with live database data on every message:
- Available kits (with Euro 6 and machine type flags)
- Published upgrades and finance plans
- **Popularity intelligence** — live stats on what other customers are choosing (e.g. "80% of recent customers add the 48V system") to inform Max's recommendations

### Admin AI Conversations Page (`/admin/ai-conversations`)
- Live-updating feed of all AI sessions with full transcript viewer
- Conversion tracking: lead captured, 48V system pitched, customer response
- "Open in Configurator" — pre-loads the AI's chosen configuration into the admin build tool for staff to finalise
- Mark as contacted with private follow-up notes
- Auto-creates Draft quotes from conversations where `config_completed = TRUE` but no quote was formally submitted

### `aiConfiguratorMapping.ts`
Translates the AI's `AIConfig` output object into the `configurator:v6` state format used by the main site — the single source of truth for AI-to-quote conversion.

---

## Admin Panel

### Access Control
Three role levels enforced server-side on every route:

| Role | Access |
|---|---|
| **None** | No admin access; redirected to homepage |
| **Basic Admin** | Quotes and leads: view, edit configurations, apply discounts, change status, view build sheets, access build-progress pages |
| **Full Admin** | Everything in Basic, plus: user management, van/kit/upgrade inventory, analytics, finance plans, training options, gallery, blog, send confirmation emails, delete quotes, Sage invoice push, AutoTradeOS push, AI conversation management, Max AI settings |
| **Finance** | Restricted Finance Portal only — review applications, update approval status |

### Dashboard (`/admin`)
- Revenue summary, conversion rates, active builds, overdue follow-up alerts
- Quick-access links to recent quotes, leads, and AI conversations

### Quote Management (`/admin/quotes`)
- **List and Kanban views** with status columns: New → Contacted → Awaiting Deposit → Awaiting Finance → Deposit Taken → Finance Approved → In Build → Completed / Cancelled
- Stale quote flagging, CSV export, overdue follow-up indicators
- Follow-up scheduling and task management

### Quote Detail (`/admin/quotes/:id`)

**Overview tab**
- Customer journey timeline with action buttons to advance status
- Internal admin notes and status-change audit log
- Customer reassignment history (if quote moved between contacts)

**Configuration tab**
- Van selector (system inventory or custom/off-website van with manual value entry)
- Registration number field (pre-populated by CheckCarDetails lookup)
- Equipment Pack selector — visible for Car and Hybrid service types (hidden for Commercial Only)
- Upgrades editor organised by admin-defined category order, with:
  - Original customer selections highlighted in green
  - Variant selectors for grouped upgrades (e.g. wrap size)
  - Quantity controls for items with `allowQuantity`
  - SKU badges on each item
- Exclusive-group conflict resolution runs on load — quotes with conflicting saved selections are silently corrected before display
- Service type changes to Commercial automatically clear the kit and recalculate pricing
- Discount controls: percentage or fixed-£ discount with real-time price preview
- Customer logos uploaded for graphics/wrap reference
- Custom extras — bespoke line items outside the standard catalogue

**Finance tab**
- Deposit amount and term (years) editor with live monthly payment recalculation
- "Send preview to me" to audit the finance application email before sending
- Formal submission to finance partner (Jigsaw Finance) via templated email
- Finance decision tracking (approved / declined / more info needed) with timestamp

**Build tab**
- Auto-generated build stages from configuration (e.g. if wrap selected: "Artwork Sent", "Artwork Approved" added automatically)
- Manual custom stage creation, reordering, and deletion
- Workshop staff tick-off via the public Build Progress QR page
- Staff initials recorded against each completed stage

**Activity tab**
- Combined audit timeline: status changes, reassignment history, admin notes
- Internal notes with timestamp and author

**Spec & Artwork Approval**
- "Send Spec Summary Email" generates a one-time token link for the customer to review their spec
- Customer approves or flags issues; response captured and shown in admin
- Artwork proof upload and messaging thread (staff ↔ admin) for graphics sign-off

**Sage Integration**
- Pre-push preview of invoice line items
- "Push to Sage" creates a sales invoice in Sage Business Cloud Accounting
- Status badge tracks whether the quote has been pushed (with timestamp); prevents duplicate pushes

**Comparison Quotes**
- Option A vs Option B side-by-side (different vans, same kit/upgrades)
- Finance submission blocked until customer has chosen a preferred option
- Admin can view either slot's pricing independently

**Customer Linking**
- Search dialog to link a guest quote to an existing Customer profile
- Full reassignment history log with admin notes

### Build Sheet (`/admin/quotes/:id/build-sheet`)
- Internal technical spec for the workshop team; pricing excluded
- Full equipment list with quantities, SKUs, and build instructions
- **AutoTradeOS integration** — pre-flight BOM check and "Push to AutoTradeOS" to send the parts list to the warehouse fulfilment system

### Lead Management (`/admin/leads`)
- All inbound enquiries (form submissions and AI-captured contacts)
- Status tracking, follow-up scheduling, quote linking

### Customer CRM (`/admin/customers`)
- Central database of all contacts deduplicated by email and phone
- Linked quotes, leads, and AI conversations per customer
- Merge tool for duplicate records with undo/audit history
- Activity log and internal notes per customer

### Van Inventory (`/admin/vans`)
- Full CRUD for vehicle stock
- Registration lookup via CheckCarDetails API (auto-populates make/model/year/specs)
- Publish/unpublish control; published vans appear in public stock and configurator

### Equipment Kits (`/admin/kits`)
- Create, edit, and publish equipment packs
- Euro 6 compatibility flag, service type applicability (car/commercial/hybrid)
- SKU assignment and BOM component definition
- Display order sorting via up/down controls

### Upgrades & Categories (`/admin/upgrades`)
- Full upgrade catalogue management with parent/variant grouping
- Category assignment, service type flags (`carOnly`, `forCommercial`, `hideForHybrid`)
- Van size applicability (LWB/MWB/SWB)
- `exclusiveGroup` field for mutual exclusivity enforcement
- `sortOrder` field controls display order within each category in the configurator
- Admin-controlled category reordering

### SKU Manager (`/admin/sku-manager`)
- Centralised SKU catalogue for all kits and upgrades
- BOM editor — define component parts for complex items sent to AutoTradeOS
- "Generate Missing SKUs" bulk action backfills codes across the catalogue
- SKU badges displayed throughout the admin quote editor

### Finance Plans (`/admin/finance-plans`)
- Configure deposit ranges, APR, and term lengths
- Feed the front-end finance calculator and AI finance questions

### Training Options (`/admin/training-options`)
- Manage REACT (motorway operations), Tyre Fitting, and other certification packages
- Prices included in quote totals

### Portfolio Gallery (`/admin/gallery`)
- Upload and manage build showcase images and videos
- Category tagging, publish/unpublish, drag-sort ordering
- Featured flag for homepage display

### Blog (`/admin/blog`)
- Create and publish articles with SEO metadata
- AI-generated post support

### AI Conversations (`/admin/ai-conversations`)
- See above under Max AI section

### Max AI Settings (`/admin/max-settings`)
- Control Max's personality profile, knowledge base additions, and upsell aggressiveness
- Configure AI packages (Bronze/Silver/Gold tier bundles)

### Analytics (`/admin/analytics`)
- Conversion funnel metrics, popular kit and upgrade tracking
- Session and pageview data; admin sessions excluded from public stats

### Users (`/admin/users`)
- Create, edit, and deactivate admin accounts
- Role assignment (none / basic / full / finance)

### Email Preview (`/admin/email-preview`)
- Preview and test all system-generated emails before live use

### Finance Portal (`/finance-portal`)
- Separate, restricted area for external finance partners
- Review submitted applications, van/kit specs; update status to Approved / Declined / More Info Needed

### Admin Configurator (`/admin/configurator`)
- Full-featured staff-side configurator for building quotes on behalf of customers
- Service type change to Commercial with an existing kit selected triggers a "Keep or Remove Pack?" confirmation dialogue
- Incompatible upgrades auto-stripped when service type changes
- Staff receive toast notifications when exclusive-group conflicts are silently resolved
- Side-by-side comparison mode (Option A vs B) — Option B inherits all config from A; only the van differs
- "Save as Quote" dialogue captures customer name, email, phone, company, notes, and staff name; discount can be applied before saving

---

## External Integrations

| Integration | Purpose |
|---|---|
| **Sage Business Cloud** | Sales invoice creation from accepted quotes |
| **AutoTradeOS** | BOM / parts list push to warehouse fulfilment system |
| **CheckCarDetails API** | UK registration lookup — auto-populates van specs |
| **OpenAI** | Powers Max AI assistant (GPT-4 class model) |
| **Resend / SendGrid** | Transactional emails — quote confirmations, spec approval, finance applications, artwork proofs |
| **Jigsaw Finance** | Finance application email routing to underwriter |
| **Google Cloud Storage** | Image and video uploads via presigned URLs with ACL management |
| **WrapGen** | 3D wrap render auto-link and approval tracking — staff click "Open in WrapGen" from the customer profile; MTVC generates a one-time token; WrapGen opens with the token embedded and fires `POST /api/webhooks/wrapgen-link/:token` to auto-link the preview URL; customer approval fires `POST /api/webhooks/wrapgen` to record sign-off |

### WrapGen Artwork Approval Workflow
WrapGen (`http://wrapgen.co.uk`) is a standalone external tool used by the design team. MTVC does **not** call the WrapGen API to create previews.

#### Auto-link flow (primary)
1. Staff open the customer profile in MTVC and click **"Open in WrapGen"** in the WrapGen 3D Renders card
2. MTVC generates a 15-minute one-time token, stores it in `wrapgen_link_tokens`, and opens WrapGen at `http://wrapgen.co.uk?mtvc_token=TOKEN&mtvc_webhook=ENCODED_URL&mtvc_ref=QUOTE_REF`
3. The design team creates the artwork and generates the 3D render in WrapGen
4. WrapGen fires `POST /api/webhooks/wrapgen-link/:token` with `{ previewId, previewUrl }` — MTVC validates the token, saves `wrapgen_preview_url` and `wrapgen_preview_id` to the quote, and marks the token used
5. The customer profile updates automatically (polled every 5 s) — the render appears as linked with "Awaiting Approval" status

#### Manual fallback
If the artwork was created without going through MTVC, staff can expand "Paste URL manually instead" in the WrapGen 3D Renders card and paste the preview URL directly.

#### Customer approval
6. Staff share the WrapGen preview URL with the customer
7. Customer views and approves the render on WrapGen's platform
8. WrapGen fires `POST /api/webhooks/wrapgen` with `{ event: "artwork.approved", previewId, approvedByName, approvedAt }` — MTVC matches on `wrapgen_preview_id`, records approval timestamp and approver name, and appends an activity note to the quote

**Admin pages:** Customer profile → WrapGen 3D Renders card · `/admin/artwork-approvals` lists all linked previews across all quotes with approval status.

**Webhooks to configure in WrapGen:**
- Auto-link: `POST https://yourdomain.com/api/webhooks/wrapgen-link/:token` (token embedded in the URL MTVC opens)
- Approval: `POST https://yourdomain.com/api/webhooks/wrapgen` with `{ event: "artwork.approved", previewId, approvedByName, approvedAt }` (no secret header — public and idempotent)

---

## SEO & Performance

### Server-Side Rendering (SSR)
- **Entry point**: `client/src/entry-server.tsx` — renders React to string with `renderToString`, wraps in `QueryClientProvider` + `HydrationBoundary`
- **Static-import app**: `client/src/AppServer.tsx` — no `React.lazy`, for synchronous SSR
- **Data prefetching**: `server/ssr-prefetch.ts` — prefetches `/api/vans`, `/api/vans/slug/:slug`, `/api/finance-plans`, `/api/gallery-items`, `/api/blog-posts` server-side; dehydrates TanStack Query state into `window.__TANSTACK_QUERY_STATE__`
- **Client hydration**: `client/src/main.tsx` uses `hydrateRoot` + `HydrationBoundary`, reads `window.__TANSTACK_QUERY_STATE__` to skip re-fetching already-loaded data
- **Admin bypass**: `/admin/*` routes skip SSR entirely and serve the SPA shell
- **Result**: Crawlers receive fully rendered HTML for all public pages without executing JavaScript

### Structured Data (JSON-LD)
- `AutomotiveBusiness` with contact, geo-coordinates, and opening hours
- `Vehicle` and `Product` schemas for individual van listings
- `Article` schema for blog posts
- `FAQPage` for home and training pages
- `BreadcrumbList` for site navigation
- `EducationalOccupationalProgram` for training courses

### Other SEO Features
- Dynamic `<title>`, meta description, Open Graph, and Twitter Card tags via `SEO.tsx`
- Server-side meta injection for crawlers via `server/seo.ts`
- Canonical URLs on all pages
- `hreflang` en-gb
- Dynamic sitemap at `/sitemap.xml` — covers static pages, published vans, blog posts, and SEO landing pages; includes image entries
- `robots.txt` — welcomes AI crawlers (GPTBot, ClaudeBot, etc.), blocks admin and API paths
- www redirect middleware (non-www → www, 301)
- Gzip compression for all assets
- `preload="metadata"` on videos for faster initial load
- WebP image conversion script (`scripts/convert-to-webp.ts`)

---

## Technical Implementation Notes

### Startup Migrations (`server/index.ts`)
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

**Data sync on every boot:**
- `backfillSkus()` — ensures all kits and upgrades have auto-generated SKUs
- Exclusive group assignment — sets `exclusive_group = 'compressor-power-system'` on Silent Compressor and any upgrade matching `%commercial power inversion%` or `%power inversion system%` name patterns
- Customer backfill — links orphaned leads/quotes/AI conversations to Customer records by email/phone; creates new Customer records where missing
- Reassignment history backfill — populates JSONB audit arrays from legacy single-column audit fields
- AI quote repricing — recalculates totals for quotes with a £0 estimate caused by session timeouts
- AI draft creation — creates Draft quotes for AI conversations with `config_completed = TRUE` that were never formally submitted
- Unique partial indexes on `customers(email)` and `customers(phone)` (where `deleted_at IS NULL`)

### Post-Merge Setup (`scripts/post-merge.sh`)
```bash
#!/bin/bash
set -e
npm install
npx drizzle-kit push --force
```
Configured timeout: **60 seconds** (set via `.replit` post-merge config).

### State Management & React 18 Production Optimisation
- The configurator uses a custom `replaceUpgrades(toRemove[], toAdd)` method for all mutually exclusive upgrade swaps — a single atomic state update prevents race conditions from React 18's aggressive state batching
- Issue history (November 2025): production builds were allowing two mutually exclusive upgrades to be selected simultaneously due to multiple `removeUpgrade` + `addUpgrade` calls being batched unpredictably; fixed by the atomic `replaceUpgrades` approach

### Media Serving
- Backend proxy routes: `/media/:filename` for static assets, `/objects/:objectPath` for GCS-hosted content
- Video streaming with HTTP Range request support
- ACL checks on uploaded objects before serving

### Database Seeding
- Run `tsx server/seed-upgrades.ts` to manually reseed upgrade data
- Parent items for variant groups **must** have `published: true` for child variants to appear in configurator dropdowns

---

## Key Files Reference

| File | Purpose |
|---|---|
| `server/index.ts` | Express app entry, startup migrations, session setup |
| `server/routes.ts` | All API routes, Max AI system prompt, pricing engine |
| `server/auth.ts` | Authentication, session handling, role enforcement |
| `server/storage.ts` | Database access layer (all CRUD operations) |
| `shared/schema.ts` | Drizzle schema — all tables, types, Zod insert schemas |
| `client/src/lib/ConfiguratorContext.tsx` | Global configurator state, conflict resolution, dual-slot compare |
| `client/src/lib/aiConfiguratorMapping.ts` | AI output → configurator state translation |
| `client/src/pages/configurator/SelectUpgrades.tsx` | Upgrade selection UI, exclusivity enforcement, toast notifications |
| `client/src/pages/admin/QuoteDetail.tsx` | Full quote lifecycle management |
| `client/src/pages/admin/AdminConfigurator.tsx` | Staff-side configurator with service-type guards |
| `client/src/pages/admin/AIConversations.tsx` | AI session review and quote conversion |
| `client/src/components/AIChatWidget.tsx` | Max AI floating chat interface |
| `server/ssr-prefetch.ts` | SSR data prefetch route mappings |
| `client/src/entry-server.tsx` | SSR render entry point |
| `scripts/post-merge.sh` | Post-merge dependency install and schema push |
