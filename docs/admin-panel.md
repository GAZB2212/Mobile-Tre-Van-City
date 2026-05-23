# Admin Panel

## Access Control
Three role levels enforced server-side on every route:

| Role | Access |
|---|---|
| **None** | No admin access; redirected to homepage |
| **Basic Admin** | Quotes and leads: view, edit configurations, apply discounts, change status, view build sheets, access build-progress pages |
| **Full Admin** | Everything in Basic, plus: user management, van/kit/upgrade inventory, analytics, finance plans, training options, gallery, blog, send confirmation emails, delete quotes, Sage invoice push, AutoTradeOS push, AI conversation management, Max AI settings |
| **Finance** | Restricted Finance Portal only — review applications, update approval status |

## Dashboard (`/admin`)
- Revenue summary, conversion rates, active builds, overdue follow-up alerts
- Quick-access links to recent quotes, leads, and AI conversations

## Quote Management (`/admin/quotes`)
- **List and Kanban views** with status columns: New → Contacted → Awaiting Deposit → Awaiting Finance → Deposit Taken → Finance Approved → In Build → Completed / Cancelled
- Stale quote flagging, CSV export, overdue follow-up indicators
- Follow-up scheduling and task management

## Quote Detail (`/admin/quotes/:id`)

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

## Build Sheet (`/admin/quotes/:id/build-sheet`)
- Internal technical spec for the workshop team; pricing excluded
- Full equipment list with quantities, SKUs, and build instructions
- Headline machines (tyre changer / balancer / compressor) shown as "Includes:" line under the kit name — resolved via the shared `deriveHeadlineMachines` helper (admin override on the kit wins, otherwise derived from the kit's BOM by strict keyword match)
- **AutoTradeOS integration** — pre-flight BOM check and "Push to AutoTradeOS" to send the parts list to the warehouse fulfilment system

## Kiosk Pipeline (`/kiosk/pipeline/:token`)
- Workshop floor view of every active build, refreshing every 30s
- Each card shows the van, customer, equipment pack with "Includes:" headline machines, and the full build-stage checklist
- Stage rows are tappable for triple-tap tick-off with staff initials
- The Install [Pack] stage row also surfaces the headline machines inline so the lads see the actual tyre machine / balancer / compressor models against the build stage they relate to

## Lead Management (`/admin/leads`)
- All inbound enquiries (form submissions and AI-captured contacts)
- Status tracking, follow-up scheduling, quote linking

## Customer CRM (`/admin/customers`)
- Central database of all contacts deduplicated by email and phone
- Linked quotes, leads, and AI conversations per customer
- Merge tool for duplicate records with undo/audit history
- Activity log and internal notes per customer

## Van Inventory (`/admin/vans`)
- Full CRUD for vehicle stock
- Registration lookup via CheckCarDetails API (auto-populates make/model/year/specs)
- Publish/unpublish control; published vans appear in public stock and configurator

## Equipment Kits (`/admin/kits`)
- Create, edit, and publish equipment packs
- Euro 6 compatibility flag, service type applicability (car/commercial/hybrid)
- SKU assignment and BOM component definition
- **Headline Machines** textarea — one machine per line; overrides the BOM-derived "Includes:" display on build sheet and kiosk. Leave blank to let the system derive from BOM keyword match
- Display order sorting via up/down controls

## Upgrades & Categories (`/admin/upgrades`)
- Full upgrade catalogue management with parent/variant grouping
- Category assignment, service type flags (`carOnly`, `forCommercial`, `hideForHybrid`)
- Van size applicability (LWB/MWB/SWB)
- `exclusiveGroup` field for mutual exclusivity enforcement
- `sortOrder` field controls display order within each category in the configurator
- Admin-controlled category reordering

## SKU Manager (`/admin/sku-manager`)
- Centralised SKU catalogue for all kits and upgrades
- BOM editor — define component parts for complex items sent to AutoTradeOS
- "Generate Missing SKUs" bulk action backfills codes across the catalogue
- SKU badges displayed throughout the admin quote editor

## Finance Plans (`/admin/finance-plans`)
- Configure deposit ranges, APR, and term lengths
- Feed the front-end finance calculator and AI finance questions

## Training Options (`/admin/training-options`)
- Manage REACT (motorway operations), Tyre Fitting, and other certification packages
- Prices included in quote totals

## Portfolio Gallery (`/admin/gallery`)
- Upload and manage build showcase images and videos
- Category tagging, publish/unpublish, drag-sort ordering
- Featured flag for homepage display

## Blog (`/admin/blog`)
- Create and publish articles with SEO metadata
- AI-generated post support

## AI Conversations (`/admin/ai-conversations`)
See `max-ai.md`.

## Max AI Settings (`/admin/max-settings`)
- Control Max's personality profile, knowledge base additions, and upsell aggressiveness
- Configure AI packages (Bronze/Silver/Gold tier bundles)

## Analytics (`/admin/analytics`)
- Conversion funnel metrics, popular kit and upgrade tracking
- Session and pageview data; admin sessions excluded from public stats

## Users (`/admin/users`)
- Create, edit, and deactivate admin accounts
- Role assignment (none / basic / full / finance)

## Email Preview (`/admin/email-preview`)
- Preview and test all system-generated emails before live use

## Finance Portal (`/finance-portal`)
- Separate, restricted area for external finance partners
- Review submitted applications, van/kit specs; update status to Approved / Declined / More Info Needed

## Admin Configurator (`/admin/configurator`)
- Full-featured staff-side configurator for building quotes on behalf of customers
- Service type change to Commercial with an existing kit selected triggers a "Keep or Remove Pack?" confirmation dialogue
- Incompatible upgrades auto-stripped when service type changes
- Staff receive toast notifications when exclusive-group conflicts are silently resolved
- Side-by-side comparison mode (Option A vs B) — Option B inherits all config from A; only the van differs
- "Save as Quote" dialogue captures customer name, email, phone, company, notes, and staff name; discount can be applied before saving
