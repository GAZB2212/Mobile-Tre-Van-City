# Public-Facing Pages

## Customer Journey Pages
- **Home / Landing** (`/`) — Hero video, value proposition, testimonials, gallery preview, CTA to configurator
- **Van Stock** (`/stock`) — Full inventory listing with search and filters
- **Van Details** (`/stock/:slug`) — Individual vehicle page with specs, gallery, and direct configurator CTA
- **Gallery** (`/gallery`) — Portfolio of completed builds with image/video lightbox
- **Blog** (`/blog`, `/blog/:slug`) — AI-generated and editorial content with full SEO support

## Configurator Flow
Seven-step interactive build wizard (see `configurator.md`):
`/configurator/van` → `/configurator/service-type` → `/configurator/kit` → `/configurator/upgrades` → `/configurator/training` → `/configurator/finance` → `/configurator/quote`
An AI-powered review step (`/configurator/ai-review`) is available when entering via the Max AI assistant.

## Information Pages
- `/about` — Company background
- `/training` — REACT (motorway operations) and Tyre Fitting certification details
- `/how-it-works` — Process explanation
- `/business-opportunity` — Franchise/investment angle
- `/finance` — Finance product overview
- `/contact` — Enquiry form and contact details

## Programmatic SEO Landing Pages
- `/van-conversions` — Hub page for van conversion searches
- `/van-conversions/:slug` — Per-model pages (e.g. Ford Transit, Vauxhall Movano)
- `/mobile-tyre-vans` — Hub page for mobile tyre van searches
- `/mobile-tyre-vans/:slug` — Per-location pages (e.g. Liverpool, Manchester)

## Policy Pages
- `/privacy-policy`, `/terms`, `/cookie-policy`

## Customer-Facing Approval Pages (token-gated, no login required)
- `/spec-approval/:token` — Customer reviews and approves or flags their build specification
- `/artwork-approval/:token` — Customer reviews and approves graphics/wrap artwork proofs
- `/build-progress/:token` — QR-accessible build milestone tracker for the customer
