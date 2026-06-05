---
name: Van registration has two sources
description: Why a chosen van's reg plate can be blank and how to display it consistently
---

# Van registration: stock-van reg vs quote-entered reg

A van's number plate can come from two different places, and conflating them
causes stock vans to show no plate:

- `vans.reg` — the plate of a **stock van** (set per van record, often only in
  production data; dev rows are usually null).
- `quotes.vanRegistration` — a plate the customer/staff typed for an **own-van /
  finance** flow. It is null for most stock-van quotes.
- `quotes.customVanDescription` — free-text description for own vans (not a plate).

**Why it matters:** any UI/endpoint that only reads `quote.vanRegistration` will
show a blank plate whenever the customer picked a stock van, because that field
is empty in that case. The stock plate lives on the joined van record instead.

**How to apply:** when displaying the chosen van anywhere (configurator cards,
kiosk/pipeline boards, build-progress, build sheet, quote comparison/finance
banners), resolve the plate as
`quote.vanRegistration || van?.reg` (and for build-progress endpoints that pack a
single field, `quote.vanRegistration ?? van?.reg ?? quote.customVanDescription`).
Comparison slots carry their own `slot.vanRegistration`; fall back to the slot's
resolved van `.reg`. These surfaces drift easily — when adding a new chosen-van
display, check it includes the `van.reg` fallback.
